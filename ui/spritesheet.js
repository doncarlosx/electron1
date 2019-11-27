const path = require('path')

module.exports = class SpriteSheet {
    constructor(width, height, ...paths) {
        this.width = width
        this.height = height
        this.path = path.join(...paths)

        let index = 0
        const xFactor = 1.0 / width
        const yFactor = 1.0 / height
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const xMin = x * xFactor
                const xMax = xMin + xFactor
                const yMin = y * yFactor
                const yMax = yMin + yFactor
                this[index] = { xMin, xMax, yMin, yMax, }
                index += 1
            }
        }
    }
}