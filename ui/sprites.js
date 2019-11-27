module.exports = class Sprites {

    constructor(spriteUpdate, spriteRebuffer) {
        this.vertexFloatsPerSprite = 18
        this.vertexFloats = new Float32Array()
        this.textureFloatsPerSprite = 12
        this.textureFloats = new Float32Array()
        this.capacity = 0
        this.size = 0
        this.spriteUpdate = spriteUpdate
        this.spriteRebuffer = spriteRebuffer
    }

    create(x, y, z, sMin, tMin, sMax, tMax) {
        this.ensureCapacity(1)

        const vertexIndex = this.size * this.vertexFloatsPerSprite

        this.vertexFloats[vertexIndex + 0] = x + 0.0
        this.vertexFloats[vertexIndex + 1] = y + 0.0
        this.vertexFloats[vertexIndex + 2] = z

        this.vertexFloats[vertexIndex + 3] = x + 0.0
        this.vertexFloats[vertexIndex + 4] = y + 1.0
        this.vertexFloats[vertexIndex + 5] = z

        this.vertexFloats[vertexIndex + 6] = x + 1.0
        this.vertexFloats[vertexIndex + 7] = y + 1.0
        this.vertexFloats[vertexIndex + 8] = z

        this.vertexFloats[vertexIndex + 9] = x + 1.0
        this.vertexFloats[vertexIndex + 10] = y + 1.0
        this.vertexFloats[vertexIndex + 11] = z

        this.vertexFloats[vertexIndex + 12] = x + 1.0
        this.vertexFloats[vertexIndex + 13] = y + 0.0
        this.vertexFloats[vertexIndex + 14] = z

        this.vertexFloats[vertexIndex + 15] = x + 0.0
        this.vertexFloats[vertexIndex + 16] = y + 0.0
        this.vertexFloats[vertexIndex + 17] = z

        const textureIndex = this.size * this.textureFloatsPerSprite

        this.textureFloats[textureIndex + 0] = sMin
        this.textureFloats[textureIndex + 1] = tMax

        this.textureFloats[textureIndex + 2] = sMin
        this.textureFloats[textureIndex + 3] = tMin

        this.textureFloats[textureIndex + 4] = sMax
        this.textureFloats[textureIndex + 5] = tMin

        this.textureFloats[textureIndex + 6] = sMax
        this.textureFloats[textureIndex + 7] = tMin

        this.textureFloats[textureIndex + 8] = sMax
        this.textureFloats[textureIndex + 9] = tMax

        this.textureFloats[textureIndex + 10] = sMin
        this.textureFloats[textureIndex + 11] = tMax

        this.spriteUpdate(this.size)
        this.size += 1
    }

    ensureCapacity(plusThis) {
        if (this.size + plusThis <= this.capacity) {
            return
        }

        let newCapacity = this.capacity * 2
        if (newCapacity === 0) {
            newCapacity = plusThis * 10
        }

        const newVertexFloats = new Float32Array(newCapacity * this.vertexFloatsPerSprite)
        newVertexFloats.set(this.vertexFloats)
        this.vertexFloats = newVertexFloats

        const newTextureFloats = new Float32Array(newCapacity * this.textureFloatsPerSprite)
        newTextureFloats.set(this.textureFloats)
        this.textureFloats = newTextureFloats

        this.capacity = newCapacity
        this.spriteRebuffer()
    }

    move(sprite, x, y, z) {
        const vertexIndex = sprite * this.vertexFloatsPerSprite

        this.vertexFloats[vertexIndex + 0] += x
        this.vertexFloats[vertexIndex + 1] += y
        this.vertexFloats[vertexIndex + 2] += z

        this.vertexFloats[vertexIndex + 3] += x
        this.vertexFloats[vertexIndex + 4] += y
        this.vertexFloats[vertexIndex + 5] += z

        this.vertexFloats[vertexIndex + 6] += x
        this.vertexFloats[vertexIndex + 7] += y
        this.vertexFloats[vertexIndex + 8] += z

        this.vertexFloats[vertexIndex + 9] += x
        this.vertexFloats[vertexIndex + 10] += y
        this.vertexFloats[vertexIndex + 11] += z

        this.vertexFloats[vertexIndex + 12] += x
        this.vertexFloats[vertexIndex + 13] += y
        this.vertexFloats[vertexIndex + 14] += z

        this.vertexFloats[vertexIndex + 15] += x
        this.vertexFloats[vertexIndex + 16] += y
        this.vertexFloats[vertexIndex + 17] += z

        this.spriteUpdate(sprite)
    }

    delete(sprite) {
        const vertexIndex = sprite * this.vertexFloatsPerSprite

        this.vertexFloats[vertexIndex + 0] = 0
        this.vertexFloats[vertexIndex + 1] = 0
        this.vertexFloats[vertexIndex + 2] = 0

        this.vertexFloats[vertexIndex + 3] = 0
        this.vertexFloats[vertexIndex + 4] = 0
        this.vertexFloats[vertexIndex + 5] = 0

        this.vertexFloats[vertexIndex + 6] = 0
        this.vertexFloats[vertexIndex + 7] = 0
        this.vertexFloats[vertexIndex + 8] = 0

        this.vertexFloats[vertexIndex + 9] = 0
        this.vertexFloats[vertexIndex + 10] = 0
        this.vertexFloats[vertexIndex + 11] = 0

        this.vertexFloats[vertexIndex + 12] = 0
        this.vertexFloats[vertexIndex + 13] = 0
        this.vertexFloats[vertexIndex + 14] = 0

        this.vertexFloats[vertexIndex + 15] = 0
        this.vertexFloats[vertexIndex + 16] = 0
        this.vertexFloats[vertexIndex + 17] = 0

        this.spriteUpdate(sprite)
    }

}