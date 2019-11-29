const net = require('net')

const Game = require('./game/game')
const Protocol = require('./game/protocol')
const Commands = require('./game/commands')

const server = net.createServer()
const game = new Game()
const protocol = new Protocol()

server.on('connection', connectionHandler)

let connectionID = 0
const connections = new Set()

function connectionHandler(socket) {
    const connection = {
        socket,
        id: connectionID += 1,
        tick: 0,
    }
    connections.add(connection)
    socket.on('data', data => incomingData(connection, data))
    socket.on('end', () => connections.delete(connection))
}

function incomingData(connection, data) {
    const messages = protocol.read(data)
    for (let message of messages) {
        console.log(`Server hears serverTick=${game.tick} connection=${connection.id} player=${message.playerID} command=${message.command} prediction=${message.predictionID}`)
        if (message.command === Commands.Sync) {
            return handleSync(connection, message)
        } else if (message.command === Commands.NewPlayer) {
            return handleNewPlayer(connection, message)
        } else if (message.command === Commands.Move) {
            return handleMove(connection, message)
        }
    }
}

function handleSync(sender, message) {
    const players = []
    for (let player of game.players) {
        players.push({
            id: player.id,
            x: player.x,
            y: player.y,
        })
    }
    const payload = JSON.stringify({
        command: message.command,
        connectionID: sender.id,
        serverTick: game.tick,
        players,
    })
    const response =`${payload}\n`
    console.log(`Server says ${payload}`)
    sender.socket.write(response, 'utf8')
    sender.tick = game.tick
}

function handleNewPlayer(sender, message) {
    const player = game.addPlayer()
    const tick = game.nexttick()
    
    const payload = JSON.stringify({
        command: message.command,
        playerID: player.id,
        connectionID: sender.id,
        serverTick: tick,
        x: player.x,
        y: player.y,
    })
    
    const response = `${payload}\n`
    for (let connection of connections) {
        console.log(`Server says ${payload}`)
        connection.socket.write(response, 'utf8')
        connection.tick = tick
    }
}

function handleMove(sender, message) {
    const { command, playerID, x, y, predictionID } = message
    
    if (game.canMove(playerID, x, y)) {
        const player = game.getPlayer(playerID)
        player.x += x
        player.y += y
        game.nexttick()
        const payload = JSON.stringify({
            command,
            predictionID,
            playerID,
            connectionID: sender.id,
            serverTick: game.tick,
            x: message.x,
            y: message.y,
        })
        const response = `${payload}\n`
        for (let connection of connections) {
            console.log(`Server says ${payload}`)
            connection.socket.write(response, 'utf8')
            connection.tick = game.tick
        }
    } else {
        const payload = JSON.stringify({
            command: Commands.Void,
            predictionID: message.predictionID,
            playerID: message.playerID,
            connectionID: sender.id,
            serverTick: game.tick,
        })
        console.log(`Server says ${payload}`)
        sender.socket.write(`${payload}\n`, 'utf8')
    }
}

server.listen(11111)