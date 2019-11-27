const net = require('net')

const server = net.createServer()

const EventEmitter = require('events')

const emitter = new EventEmitter()


try {
    emitter.on('test', test)
    function test() {
        emitter.emit('error')
    }
} catch {
    console.log('butts')
}

emitter.emit('test')