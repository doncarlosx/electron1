const assert = require('assert').strict
const net = require('net')

const Game = require('./game/game')
const Commands = require('./game/commands')
const Protocol = require('./game/protocol')

const UI = require('./ui/ui')
const Sprites = require('./ui/sprites')
const SpriteSheet = require('./ui/spritesheet')
const Predictions = require('./ui/predictions')

const ui = new UI()
const sprites = new Sprites(spriteUpdate, spriteRebuffer)
const spriteSheet = new SpriteSheet(1, 2, __dirname, 'ui', 'assets', 'avatar2.png')

async function start() {
    await ui.init(document)
    window.requestAnimationFrame(drawFrame)
}

start()

function drawFrame(time) {
    ui.drawFrame(time, window.innerWidth, window.innerHeight, sprites.size * 6)
    window.requestAnimationFrame(drawFrame)
}

function spriteUpdate(index) {
    const { gl } = ui
    ui.bindVertexBuffer()
    gl.bufferSubData(
        gl.ARRAY_BUFFER,
        index * sprites.vertexFloatsPerSprite * 4,
        sprites.vertexFloats,
        index * sprites.vertexFloatsPerSprite,
        sprites.vertexFloatsPerSprite)
    ui.bindTextureBuffer()
    gl.bufferSubData(
        gl.ARRAY_BUFFER,
        index * sprites.textureFloatsPerSprite * 4,
        sprites.textureFloats,
        index * sprites.textureFloatsPerSprite,
        sprites.textureFloatsPerSprite)
}

function spriteRebuffer() {
    const { gl } = ui
    ui.bindVertexBuffer()
    gl.bufferData(gl.ARRAY_BUFFER, sprites.vertexFloats, gl.DYNAMIC_DRAW, 0)
    ui.bindTextureBuffer()
    gl.bufferData(gl.ARRAY_BUFFER, sprites.textureFloats, gl.DYNAMIC_DRAW, 0)
}

const game = new Game()
const protocol = new Protocol()
const connection = net.connect(11111, '192.168.1.4')
const predictions = new Predictions()

connection.on('connect', () => {
    const payload = JSON.stringify({ command: Commands.Sync })
    connection.write(`${payload}\n`, 'utf8')
})

connection.on('data', data => {
    const messages = protocol.read(data)
    for (let message of messages) {
        // console.log(`Server says tick=${message.serverTick} conn=${message.connectionID} player=${message.playerID} command=${message.command}, predictionID=${message.predictionID}`)
        if (message.command === Commands.Sync) {
            handleSync(message)
        } else if (message.command === Commands.NewPlayer) {
            handleNewPlayer(message)
        } else if (message.command === Commands.Move) {
            handleMove(message)
        } else if (message.command === Commands.Void) {
            handleVoid(message)
        }
    }
    resolvePredictions()
})

function rollback(prediction) {
    prediction.rollback()
}

function rollforward(prediction) {
    if (prediction.command === Commands.NewPlayer) {
        applyNewPlayer(prediction)
    } else if (prediction.command === Commands.Move) {
        applyMove(prediction)
    } else if (prediction.command === Commands.Void) {
        prediction.rollback = () => {}
    }
}

function applyNewPlayer(prediction) {
    const { playerID, connectionID, x, y } = prediction
    if (game.getPlayer(playerID)) {
        throw new Error(`player to add already exists ${playerID}`)
    }
    createPlayer(playerID, x, y)
    if (connectionID === game.connectionID) {
        game.playerID = playerID
    }
    prediction.rollback = () => {
        if (!game.players.delete(player)) {
            throw new Error(`player to remove does not exist ${player}`)
        }
        sprites.delete(player.spriteID)
        game.playerID = 0
    }
}

function applyMove(prediction) {
    const { playerID, x, y } = prediction
    if (!game.getPlayer(playerID)) {
        throw new Error(`player to move does not exist player=${playerID}`)
    }
    if (!game.canMove(playerID, x, y)) {
        throw new Error(`invalid move player=${playerID} x=${x} y = ${y}`)
    }
    const player = game.getPlayer(playerID)
    player.x += x
    player.y += y
    sprites.move(player.spriteID, x, y, 0)
    prediction.rollback = () => {
        const reverseX = x * -1
        const reverseY = y * -1
        if (!game.canMove(playerID, reverseX, reverseY)) {
            throw new Error(`invalid move in reverse player=${playerID} x=${x} y=${y}`)
        }
        player.x += reverseX
        player.y += reverseY
        sprites.move(player.spriteID, reverseX, reverseY, 0)
    }
}

function desync() {
    game.synced = false
}

function sync() {
    game.synced = true
}

function tick() {
    return game.nexttick()
}

function createPlayer(playerID, x, y) {
    const player = game.addPlayer(playerID, x, y)
    player.spriteID = sprites.size
    sprites.create(player.x, player.y, 0, spriteSheet[1].xMin, spriteSheet[1].yMin, spriteSheet[1].xMax, spriteSheet[1].yMax)
}

function handleSync(message) {
    const { connectionID, serverTick, players } = message

    game.connectionID = connectionID
    game.tick = serverTick
    game.synced = true
    for (let { playerID, x, y } of players) {
        createPlayer(playerID, x, y)
    }

    const payload = JSON.stringify({ command: Commands.NewPlayer })
    connection.write(`${payload}\n`, 'utf8')

    predictions.enableResolution()
}

function handleNewPlayer(message) {
    const { command, playerID, connectionID, serverTick, x, y } = message
    const prediction = {
        command,
        playerID,
        connectionID,
        tick: serverTick,
        fromServer: true,
        applied: false,
        x,
        y,
    }
    predictions.push(prediction)
}

function handleMove(message) {
    const { command, predictionID, playerID, connectionID, serverTick, x, y } = message
    const prediction = {
        command,
        id: predictionID,
        playerID,
        connectionID,
        tick: serverTick,
        fromServer: true,
        applied: false,
        x,
        y,
    }
    predictions.push(prediction)
}

function handleVoid(message) {
    const { command, predictionID, playerID, connectionID, serverTick } = message
    const prediction = {
        command,
        id: predictionID,
        playerID,
        connectionID,
        tick: serverTick,
        fromServer: true,
        applied: false,
    }
    predictions.push(prediction)
}

window.addEventListener('keydown', keyDown, true)

function keyDown(e) {
    if (!game.synced) {
        return
    }
    
    const { playerID, connectionID } = game
    
    if (playerID <= 0) {
        return
    }
    
    function predictMove(x, y) {
        const prediction = {
            command: Commands.Move,
            id: predictions.nextID(),
            playerID,
            connectionID,
            tick: undefined,
            fromServer: false,
            applied: false,
            x,
            y,
        }
        predictions.push(prediction)
        resolvePredictions()
        return prediction
    }

    function sendMove(x, y) {
        const prediction = predictMove(x, y)
        const payload = JSON.stringify({
            command: Commands.Move,
            playerID,
            x,
            y,
            predictionID: prediction.id,
        })
        const message = `${payload}\n`
        connection.write(message, 'utf8')
    }

    if (e.key === 'ArrowUp') {
        if (game.canMove(playerID, 0, 1)) {
            sendMove(0, 1)
        }
    } else if (e.key === 'ArrowRight') {
        if (game.canMove(playerID, 1, 0)) {
            sendMove(1, 0)
        }
    } else if (e.key === 'ArrowDown') {
        if (game.canMove(playerID, 0, -1)) {
            sendMove(0, -1)
        }
    } else if (e.key === 'ArrowLeft') {
        if (game.canMove(playerID, -1, 0)) {
            sendMove(-1, 0)
        }
    }
}

function resolvePredictions() {
    predictions.resolve(
        game.synced,
        game.connectionID,
        game.tick,
        rollback,
        rollforward,
        desync,
        sync,
        tick,
    )
}

// sprites.create(0, 0, 0, spriteSheet[1].xMin, spriteSheet[1].yMin, spriteSheet[1].xMax, spriteSheet[1].yMax)
// sprites.create(2, 3, 0, spriteSheet[0].xMin, spriteSheet[0].yMin, spriteSheet[0].xMax, spriteSheet[0].yMax)

// const spectorjs = require('spectorjs')
// const spector = new spectorjs.Spector()
// spector.displayUI()
