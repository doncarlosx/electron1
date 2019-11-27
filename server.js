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
        if (message.command === Commands.NewPlayer) {
            return handleNewPlayer(connection, message)
        }
        if (message.command === Commands.Sync) {
            return handleSync(connection, message)
        }
        if (message.command === Commands.Move) {
            return handleMove(connection, message)
        }
    }
}

function handleNewPlayer(sender, message) {
    const [player, _] = game.addPlayer()
    const tick = game.nexttick()
    
    const payload = JSON.stringify({
        connectionID: sender.id,
        serverTick: tick,
        predictionID: message.predictionID,
        command: message.command,
        playerID: player.id,
    })
    
    const response = `${payload}\n`
    
    for (let connection of connections) {
        connection.socket.write(response, 'utf8')
        connection.tick = tick
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
        connectionID: sender.id,
        tick: game.tick,
        players,
        command: message.command,
    })

    const response =`${payload}\n`

    sender.socket.write(response, 'utf8')
    sender.tick = game.tick
}

function handleMove(sender, message) {
    if (game.canMove(message.playerID, message.x, message.y)) {
        for (let player of game.players) {
            if (player.id === message.playerID) {
                player.x += message.x
                player.y += message.y
                break
            }
        }
        game.nexttick()
        const payload = JSON.stringify({
            connectionID: sender.id,
            playerID: message.playerID,
            x: message.x,
            y: message.y,
            serverTick: game.tick,
            predictionID: message.predictionID,
            command: message.command,
        })
        const response = `${payload}\n`
        for (let connection of connections) {
            connection.socket.write(response, 'utf8')
            connection.tick = game.tick
        }
    } else {

    }
}

server.listen(11111)