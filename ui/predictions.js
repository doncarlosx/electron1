const assert = require('assert').strict

module.exports = class Predictions {
    constructor() {
        this.idCounter = 0
        this.applied = []
        this.unappliedLocal = []
        this.unappliedServer = []
        this.resolutionEnabled = false
    }

    push(prediction) {
        assert.ok(prediction.command)
        assert.ok(prediction.playerID)
        assert.ok(prediction.connectionID)
        assert.ok(prediction.fromServer !== undefined)
        assert.ok(prediction.applied === false)
        if (prediction.fromServer) {
            this.unappliedServer.push(prediction)
        } else {
            this.unappliedLocal.push(prediction)
        }
    }

    resolve(synced, connectionID, nextTick, rollback, rollforward, desync, sync, tick) {
        if (!this.resolutionEnabled) {
            return
        }
        const idsToRemove = new Map()
        const { applied, unappliedServer, unappliedLocal } = this
        unappliedServer.sort((a, b) => a.tick - b.tick)
        let unappliedServerIndex = 0
        for (let i = 0; i < applied.length; i++) {
            if (unappliedServerIndex >= unappliedServer.length) {
                break
            }
            const serverPrediction = unappliedServer[unappliedServerIndex]
            if (applied[i].tick >= serverPrediction.tick) {
                applied.splice(i, 0, serverPrediction)
                unappliedServerIndex += 1
                if (serverPrediction.connectionID === connectionID && serverPrediction.id) {
                    idsToRemove.set(serverPrediction.id, true)
                }
            }
        }
        for (let i = unappliedServerIndex; i < unappliedServer.length; i++) {
            const serverPrediction = unappliedServer[unappliedServerIndex]
            applied.push(serverPrediction)
            if (serverPrediction.connectionID === connectionID && serverPrediction.id) {
                idsToRemove.set(serverPrediction.id, true)
            }
        }
        this.unappliedServer = []
        for (let i = 0; i < applied.length; i++) {
            if (!applied[i].applied) {
                for (let j = applied.length - 1; j >= i; j--) {
                    const prediction = applied[j]
                    if (prediction.applied) {
                        rollback(prediction)
                        prediction.applied = false
                    }
                }
                break
            }
        }
        for (let prediction of unappliedLocal) {
            applied.push(prediction)
        }
        this.unappliedLocal = []
        let collapsing = true
        for (let i = 0; i < applied.length; i++) {
            const prediction = applied[i]
            if (prediction.fromServer) {
                if (!prediction.applied) {
                    rollforward(prediction)
                    prediction.applied = true
                }
                if (collapsing && prediction.tick === nextTick) {
                    applied.splice(i, 1)
                    i -= 1
                    continue
                }
                if (collapsing && prediction.tick === nextTick + 1) {
                    applied.splice(i, 1)
                    nextTick = tick()
                    i -= 1
                    continue
                }
                nextTick = prediction.tick
                collapsing = false
                continue
            }
            if (idsToRemove.has(prediction.id)) {
                applied.splice(i, 1)
                i -= 1
                for (let j = 0; j < applied.length; j++) {
                    if (applied[j].id === prediction.id && applied[j].fromServer === false) {
                        debugger
                    }
                }
                continue
            }
            {
                prediction.tick = nextTick += 1
                if (synced && !prediction.applied) {
                    try {
                        rollforward(prediction)
                        prediction.applied = true
                    } catch {
                        desync()
                        synced = false
                    }
                }
                continue
            }
        }
        if (applied.length === 0) {
            sync()
        }
    }

    nextID() {
        return this.idCounter += 1
    }

    enableResolution() {
        this.resolutionEnabled = true
    }
}