attribute vec4 position;
attribute vec2 textureVertex;
varying vec2 textureCoordinate;
uniform vec2 screen;

void main() {
  textureCoordinate.x = textureVertex.x;
  textureCoordinate.y = textureVertex.y;
  gl_Position.x = position.x * (32.0 / screen.x) * 3.0;
  gl_Position.y = position.y * (32.0 / screen.y) * 3.0;
  gl_Position.z = position.z;
  gl_Position.w = position.w;
}