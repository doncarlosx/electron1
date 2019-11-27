const assert = require('assert').strict
const fs = require('fs')
const path = require('path')

module.exports = class UI {
    constructor() {
        this.currentTime = 0
        this.vertexShaders = {}
        this.fragmentShaders = {}
        this.programs = {}
        this.buffers = {}
    }

    async init(document) {
        assert.ok(document)
        this.document = document
        this.initCanvas()
        this.initGL()
        this.readVertexShaders()
        this.readFragmentShaders()
        this.initPrograms()
        this.initVertexBuffer()
        this.initTextureBuffer()
        this.initTexture()
        await this.loadImage()

        this.gl.useProgram(this.programs.first)
    }

    initCanvas() {
        const { document } = this
        document.write('<canvas id="canvas" style="position: absolute; left: 0px; top: 0px"></canvas>')
        this.canvas = document.getElementById('canvas')
        assert.ok(this.canvas)
    }

    initGL() {
        const { canvas } = this
        this.gl = canvas.getContext("webgl2")
        assert.ok(this.gl)
    }

    readVertexShaders() {
        const { gl } = this
        this.vertexShaders.first = this.readShader(gl.VERTEX_SHADER, 'first.vert')
    }

    readFragmentShaders() {
        const { gl } = this
        this.fragmentShaders.first = this.readShader(gl.FRAGMENT_SHADER, 'first.frag')
    }

    readShader(type, ...paths) {
        const { gl } = this
        const shaderPath = path.join(__dirname, 'shaders', ...paths)
        const shaderCode = fs.readFileSync(shaderPath, { encoding: 'utf8' })
        const shader = gl.createShader(type)
        gl.shaderSource(shader, shaderCode)
        gl.compileShader(shader)
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
        assert.ok(success)
        return shader
    }

    initPrograms() {
        const { gl } = this
        const program = gl.createProgram()
        gl.attachShader(program, this.vertexShaders.first)
        gl.attachShader(program, this.fragmentShaders.first)
        gl.linkProgram(program)
        const linkSuccess = gl.getProgramParameter(program, gl.LINK_STATUS)
        assert.ok(linkSuccess)
        this.programs.first = program
    }

    initVertexBuffer() {
        const { gl } = this
        const location = gl.getAttribLocation(this.programs.first, "position")
        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.enableVertexAttribArray(location)
        gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0)
        this.buffers.vertex = buffer
    }

    initTextureBuffer() {
        const { gl } = this
        const location = gl.getAttribLocation(this.programs.first, "textureVertex")
        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.enableVertexAttribArray(location)
        gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0)
        this.buffers.texture = buffer
    }

    initTexture() {
        const { gl } = this
        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }

    loadImage() {
        const { gl } = this
        const img = new Image()
        img.src = 'ui/assets/avatar2.png'
        return new Promise((resolve, _) => {
            img.onload = () => {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 64, 0, gl.RGBA, gl.UNSIGNED_BYTE, img)
                resolve()
            }
        })
    }

    bindVertexBuffer() {
        const { gl } = this
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertex)
    }

    bindTextureBuffer() {
        const { gl } = this
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.texture)
    }

    drawFrame(time, width, height, vertexCount) {
        const { canvas, gl } = this
        
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width
            canvas.height = height
            gl.viewport(0, 0, canvas.width, canvas.height)
            const screenLocation = gl.getUniformLocation(this.programs.first, 'screen')
            gl.uniform2f(screenLocation, canvas.width, canvas.height)
        }
    
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        if (vertexCount > 0) {
            gl.drawArrays(gl.TRIANGLES, 0, vertexCount)
        }
        this.currentTime = time
    }
}
