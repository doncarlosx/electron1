const assert = require('assert').strict
const net = require('net')

const Game = require('./game/game')
const Commands = require('./game/commands')
const Protocol = require('./game/protocol')

const UI = require('./ui/ui')
const Sprites = require('./ui/sprites')
const SpriteSheet = require('./ui/spritesheet')

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
const commands = new Commands()
const connection = net.connect(11111, '10.27.78.102')

connection.on('connect', () => {
    const payload = JSON.stringify({ command: Commands.Sync })
    const message = `${payload}\n`
    connection.write(message, 'utf8')
})

connection.on('data', data => {
    const messages = protocol.read(data)
    for (let message of messages) {
        if (message.command === Commands.NewPlayer) {
            return handleNewPlayer(message)
        }
        if (message.command === Commands.Sync) {
            return handleSync(message)
        }
        if (message.command === Commands.Move) {
            return handleMove(message)
        }
        if (message.command === Commands.Void) {
            return handleVoid(message)
        }
    }
})

function handleNewPlayer(message) {
    assert.ok(message)
    assert.ok(message.connectionID)
    assert.ok(message.serverTick)
    assert.ok(message.predictionID)
    assert.ok(message.playerID)

    if (message.connectionID === game.connectionID) {
        for (let i = 0; i < predictions.length; i++) {
            const prediction = predictions[i]
            if (prediction.tick === message.serverTick || prediction.id === message.predictionID) {
                game.synced && rollbackTo(prediction.tick)
            }
        }
        for (let i = 0; i < predictions.length; i++) {
            const prediction = predictions[i]
            if (prediction.id === message.predictionID) {
                predictions.splice(i, 1)
            }
        }
        predictions.push({
            fromServer: true,
            tick: message.serverTick,
            command: Commands.NewPlayer,
            playerID: message.playerID,
            applied: false,
        })
        game.thisPlayer = message.playerID
        predictions.sort((a, b) => a.tick - b.tick)
        game.synced && rollforwardTo(Infinity)
    } else {
        game.synced && rollbackTo(message.serverTick)
        predictions.push({
            fromServer: true,
            tick: message.serverTick,
            command: Commands.NewPlayer,
            playerID: message.playerID,
            applied: false,
        })
        predictions.sort((a, b) => a.tick - b.tick)
        game.synced && rollforwardTo(Infinity)
    }
    collapsePredictions()
}

let predictionID = 0

function handleSync(message) {
    assert.ok(message)
    assert.ok(message.players)
    assert.ok(message.connectionID)
    game.connectionID = message.connectionID
    game.tick = message.tick
    game.synced = true
    rollbackTo(0)
    for (let player of message.players) {
        const [newPlayer, _] = game.addPlayer(player.id, player.x,  player.y)
        newPlayer.spriteID = sprites.size
        sprites.create(newPlayer.x, newPlayer.y, 0, spriteSheet[1].xMin, spriteSheet[1].yMin, spriteSheet[1].xMax, spriteSheet[1].yMax)
    }
    rollforwardTo(Infinity)
    collapsePredictions()

    // test
    const pid = predictionID += 1
    let tick
    if (predictions.length > 0) {
        tick = predictions[predictions.length - 1].tick + 1
    } else {
        tick = game.tick + 1
    }
    const [player, rollback] = game.addPlayer()
    predictions.push({
        command: Commands.NewPlayer,
        id: pid,
        tick,
        applied: true,
        rollback,
        playerID: player.id,
    })
    player.spriteID = sprites.size
    sprites.create(player.x, player.y, 0, spriteSheet[1].xMin, spriteSheet[1].yMin, spriteSheet[1].xMax, spriteSheet[1].yMax)
    const payload = JSON.stringify({
        command: Commands.NewPlayer,
        predictionID,
    })
    connection.write(`${payload}\n`)
}

function handleMove(message) {
    assert.ok(message)
    assert.ok(message.connectionID)
    assert.ok(message.serverTick)
    assert.ok(message.predictionID)
    assert.ok(message.playerID)

    if (message.connectionID === game.connectionID) {
        for (let i = 0; i < predictions.length; i++) {
            const prediction = predictions[i]
            if (prediction.tick === message.serverTick || prediction.id === message.predictionID) {
                game.synced && rollbackTo(prediction.tick)
            }
        }
        for (let i = 0; i < predictions.length; i++) {
            const prediction = predictions[i]
            if (prediction.id === message.predictionID) {
                predictions.splice(i, 1)
            }
        }
        predictions.push({
            fromServer: true,
            tick: message.serverTick,
            command: Commands.Move,
            playerID: message.playerID,
            x: message.x,
            y: message.y,
            applied: false,
        })
        predictions.sort((a, b) => a.tick - b.tick)
        game.synced && rollforwardTo(Infinity)
    } else {
        game.synced && rollbackTo(message.serverTick)
        predictions.push({
            fromServer: true,
            tick: message.serverTick,
            command: Commands.Move,
            playerID: message.playerID,
            x: message.x,
            y: message.y,
            applied: false,
        })
        predictions.sort((a, b) => a.tick - b.tick)
        game.synced && rollforwardTo(Infinity)
    }
    collapsePredictions()
}

function handleVoid(message) {
    for (let i = 0; i < predictions.length; i++) {
        const prediction = predictions[i]
        if (prediction.tick === message.serverTick || prediction.id === message.predictionID) {
            game.synced && rollbackTo(prediction.tick)
        }
    }
    for (let i = 0; i < predictions.length; i++) {
        const prediction = predictions[i]
        if (prediction.id === message.predictionID) {
            predictions.splice(i, 1)
        }
    }
    game.synced && rollforwardTo(Infinity)
}

const predictions = []

function rollbackTo(tick) {
    for (let i = predictions.length - 1; i >= 0; i--) {
        const prediction = predictions[i]
        if (prediction.tick >= tick) {
            rollback(prediction)
        } else {
            break
        }
    }
}

function rollback(prediction) {
    if (!prediction.applied) {
        return
    }
    if (prediction.command === Commands.NewPlayer) {
        for (let player of game.players) {
            if (player.id === prediction.playerID) {
                sprites.delete(player.spriteID)
            }
        }
    }
    prediction.rollback()
    prediction.applied = false
}

function rollforwardTo(tick) {
    let previous
    for (let i = 0; i < predictions.length; i++) {
        const prediction = predictions[i]
        if (prediction.tick <= tick) {
            const success = rollforward(prediction, previous)
            if (!success) {
                game.synced = false
                break
            }
        }
        previous = prediction
    }
}

function rollforward(prediction, previous) {
    assert.ok(prediction)

    if (prediction.applied) {
        return true
    }

    assert.ok(prediction.tick)
    if (prediction.fromServer) {
        // assert.ok(prediction.tick === game.tick + 1)
    } else {
        if (previous === undefined) {
            prediction.tick = game.tick + 1
        } else {
            prediction.tick = previous.tick + 1
        }
    }

    try {
        if (prediction.command === Commands.NewPlayer) {
            applyNewPlayer(prediction)
        } else if (prediction.command === Commands.Move) {
            applyMove(prediction)
        }
        return true
    } catch {
        return false
    }
}

function applyNewPlayer(prediction) {
    assert.ok(prediction.playerID)
    const [player, rollback] = game.addPlayer(prediction.playerID)
    player.spriteID = sprites.size
    sprites.create(player.x, player.y, 0, spriteSheet[1].xMin, spriteSheet[1].yMin, spriteSheet[1].xMax, spriteSheet[1].yMax)
    prediction.rollback = rollback
    prediction.applied = true
}

function applyMove(prediction) {
    if (!game.canMove(prediction.playerID, prediction.x, prediction.y, 0)) {
        throw new Error('oops')
    }
    for (let player of game.players) {
        if (player.id === prediction.playerID) {
            sprites.move(player.spriteID, prediction.x, prediction.y, 0)
            player.x += prediction.x
            player.y += prediction.y
            prediction.applied = true
            prediction.rollback = () => {
                sprites.move(player.spriteID, prediction.x * -1,  prediction.y * -1, 0)
                player.x -= prediction.x
                player.y -= prediction.y
            }
            break
        }
    }
}

function collapsePredictions() {
    let i
    for (i = 0; i < predictions.length; i++) {
        const prediction = predictions[i]
        if (!prediction.fromServer) {
            break
        }
        rollforward(prediction)
        game.nexttick()
    }
    predictions.splice(0, i)
    if (predictions.length === 0) {
        game.synced = true
    }
}

window.addEventListener('keydown', keyDown, true)

function keyDown(e) {
    if (game.synced) {
        let thisPlayer
        for (let player of game.players) {
            if (player.id === game.thisPlayer) {
                thisPlayer = player
                break
            }
        }
        let tick
        if (predictions.length > 0) {
            tick = predictions[predictions.length - 1].tick + 1
        } else {
            tick = game.tick + 1
        }
        const prediction = {
            command: Commands.Move,
            id: predictionID += 1,
            tick,
            applied: true,
            playerID: thisPlayer.id,
        }
        if (e.key === 'ArrowUp') {
            if (game.canMove(thisPlayer.id, 0, 1)) {
                sprites.move(thisPlayer.spriteID, 0, 1, 0)
                thisPlayer.y += 1
                prediction.rollback = () => {
                    sprites.move(thisPlayer.spriteID, 0, -1, 0)
                    thisPlayer.y -= 1
                }
                predictions.push(prediction)
                prediction.x = 0
                prediction.y = 1
            }
        }
        if (e.key === 'ArrowRight') {
            if (game.canMove(thisPlayer.id, 1, 0)) {
                sprites.move(thisPlayer.spriteID, 1, 0, 0)
                thisPlayer.x += 1
                prediction.rollback = () => {
                    sprites.move(thisPlayer.spriteID, -1, 0, 0)
                    thisPlayer.x -= 1
                }
                predictions.push(prediction)
                prediction.x = 1
                prediction.y = 0
            }
        }
        if (e.key === 'ArrowDown') {
            if (game.canMove(thisPlayer.id, 0, -1)) {
                sprites.move(thisPlayer.spriteID, 0, -1, 0)
                thisPlayer.y -= 1
                prediction.rollback = () => {
                    sprites.move(thisPlayer.spriteID, 0, 1, 0)
                    thisPlayer.y += 1
                }
                predictions.push(prediction)
                prediction.x = 0
                prediction.y = -1
            }
        }
        if (e.key === 'ArrowLeft') {
            if (game.canMove(thisPlayer.id, -1, 0)) {
                sprites.move(thisPlayer.spriteID, -1, 0, 0)
                thisPlayer.x -= 1
                prediction.rollback = () => {
                    sprites.move(thisPlayer.spriteID, 1, 0, 0)
                    thisPlayer.x += 1
                }
                predictions.push(prediction)
                prediction.x = -1
                prediction.y = 0
            }
        }
        if (prediction.rollback) {
            const payload = JSON.stringify({
                command: Commands.Move,
                playerID: thisPlayer.id,
                x: prediction.x,
                y: prediction.y,
                predictionID: prediction.id,
            })
            const message = `${payload}\n`
            connection.write(message, 'utf8')
        }
    }
}

// sprites.create(0, 0, 0, spriteSheet[1].xMin, spriteSheet[1].yMin, spriteSheet[1].xMax, spriteSheet[1].yMax)
// sprites.create(2, 3, 0, spriteSheet[0].xMin, spriteSheet[0].yMin, spriteSheet[0].xMax, spriteSheet[0].yMax)

// const spectorjs = require('spectorjs')
// const spector = new spectorjs.Spector()
// spector.displayUI()
