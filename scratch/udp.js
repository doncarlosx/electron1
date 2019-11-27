const dgram = require('dgram')

const socket = dgram.createSocket('udp4')

const p = new Promise((resolve, reject) => {
    socket.on('connect', resolve)
    socket.on('error', reject)
})

socket.connect(11111, 'localhost')

async function connect() {
    await p
    const msg = new Uint8Array(4)
    msg[0] = 1
    msg[1] = 2
    msg[2] = 3
    msg[3] = 4
    socket.send(msg)
}

connect()