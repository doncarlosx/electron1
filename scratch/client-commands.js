const net = require('net')

// const socket = net.connect(11111, 'localhost')

// socket.on('connect', connected)
// socket.on('data', incomingData)

function connected() {
    socket.write('ping.garbage\n', 'utf8')
    socket.write('ping.\n', 'utf8')
    socket.write('ping.else\nping.pong\n', 'utf8')
    socket.write('garbage', 'utf8')
    socket.write('ping.\n', 'utf8')
    socket.write('ping\n', 'utf8')
    socket.write('garbage\n', 'utf8')
    socket.write('ping.\n', 'utf8')
    socket.write('connect.\n', 'utf8')
}

function incomingData(data) {
    console.log(data.toString('utf8'))
}

const Protocol = require('../game/protocol')

let buffer, messages
const protocol = new Protocol()

buffer = Buffer.alloc(1000)
messages = protocol.read(buffer)
console.log(messages)
protocol.reset()

buffer = Buffer.alloc(1000)
buffer.write(`${JSON.stringify({})}\n`, 10, 'utf8')
buffer.write(`${JSON.stringify({})}\n`, 13, 'utf8')
messages = protocol.read(buffer)
console.log(messages)
protocol.reset()