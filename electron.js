const electron = require('electron')

const config = {
    debug: process.argv.find(arg => arg === "--debug") !== undefined
}

let window

electron.app.on('ready', appReady)

function appReady() {
    window = new electron.BrowserWindow({
        backgroundColor: '#fff',
        webPreferences: {
            nodeIntegration: true
        }
    })

    window.webContents.on('dom-ready', domReady)
    if (config.debug) {
        window.webContents.openDevTools({ mode: 'detach' })
        setTimeout(() => window.loadFile('index.html'), 3000)
    } else {
        window.loadFile('index.html')
    }
}

function domReady(...args) {
}