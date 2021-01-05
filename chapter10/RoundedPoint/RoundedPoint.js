// PickObject.js
// 顶点着色器程序
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    void main() {
        gl_Position = a_Position;
        gl_PointSize = 20.0;
    }
`;

// 片元着色器程序
var FSHADER_SOURCE = `
    precision mediump float;
    void main() {
        float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
        if(dist < 0.5) {                                 // 点的半径是0.5
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        } else {
            discard;
        }
    }
`;

function main() {
    var canvas = document.getElementById('webgl');

    // 获取WebGL绘图上下文
    var gl = getWebGLContext(canvas);
    if(!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttrib2f(a_Position, 0.0, 0.0);
    gl.drawArrays(gl.POINTS, 0, 1);
}