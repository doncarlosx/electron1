let range = 0
let finalX, finalY
positions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 0],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
]
loop:
while (true) {
    range += 1
    for (let x = range * -1; x <= range; x++) {
        scanning:
        for (let y = range * -1; y <= range; y++) {
            for (let [j, k] of positions) {
                if (x === j && y === k) {
                    continue scanning
                }
            }
            finalX = x
            finalY = y
            break loop
        }
    }
}
console.log(finalX, finalY)