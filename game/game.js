const Player = require('./player')

module.exports = class Game {
    constructor() {
        this.connectionID = 0
        this.tick = 0
        this.synced = false
        this.players = new Set()
    }

    addPlayer(newPlayerID = this.players.size + 1, x, y) {
        const newPlayer = new Player(newPlayerID)
        this.players.add(newPlayer)
        let range = 0, finalX, finalY

        if (x !== undefined && y !== undefined) {
            finalX = x
            finalY = y
        } else {
            loop:
            while (true) {
                range += 1
                for (let x = range * -1; x <= range; x++) {
                    scanning:
                    for (let y = range * -1; y <= range; y++) {
                        for (let player of this.players) {
                            if (x === player.x && y === player.y) {
                                continue scanning
                            }
                        }
                        finalX = x
                        finalY = y
                        break loop
                    }
                }
            }
        }
        newPlayer.x = finalX
        newPlayer.y = finalY
        const rollback = () => this.players.delete(newPlayer)
        return [newPlayer, rollback]
    }

    canMove(playerID, x, y) {
        let movingPlayer
        for (let player of this.players) {
            if (player.id === playerID) {
                movingPlayer = player
            }
        }
        const moveXTo = movingPlayer.x + x
        const moveYTo = movingPlayer.y + y
        for (let player of this.players) {
            if (player.id !== playerID) {
                if (player.x === moveXTo && player.y === moveYTo) {
                    return false
                }
            }
        }
        return true
    }

    nexttick() {
        this.tick += 1
        return this.tick
    }
}