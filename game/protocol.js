const newline = 10

module.exports = class Protocol {
    constructor() {
        this.buffers = []
    }

    read(data) {
        const messages = []
        loop:
        while (true) {
            if (data.length === 0) {
                break
            }
            for (let i = 0; i < data.length; i++) {
                if (data[i] === newline) {
                    const message = this.readMessage(data.slice(0, i))
                    if (message) {
                        messages.push(message)
                    }
                    data = data.slice(i + 1)
                    continue loop
                }
            }
            this.buffers.push(data)
            break
        }
        return messages
    }

    readMessage(data) {
        const buffers = this.buffers
        this.buffers = []
        
        buffers.push(data)
        const payload = Buffer.concat(buffers)
        
        let message
        try {
            message = JSON.parse(payload.toString('utf8'))
        } catch {
            return
        }

        return message
    }

    reset() {
        this.buffers = []
    }
}