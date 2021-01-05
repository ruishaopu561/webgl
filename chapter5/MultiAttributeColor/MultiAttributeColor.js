// MultiAttributeSize.js
// 顶点着色器程序
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'varying vec4 v_Color;\n' + // 类型和命名都相同的varying变量会自动传入片元着色器
    'void main() {\n' +
    'gl_Position = a_Position;\n' + // 位置坐标
    'gl_PointSize = 10.0;\n' + // 设置尺寸
    'v_Color = a_Color;\n' + // 将数据传给片元着色器
    '}\n';

// 片元着色器程序
var FSHADER_SOURCE = 
    'precision mediump float;\n' +
    'varying vec4 v_Color;\n' + 
    'void main() {\n' +
    'gl_FragColor = v_Color;\n' + // 从顶点着色器接受数据
    '}\n';

function main() {
    var canvas = document.getElementById('webgl');

    var gl = getWebGLContext(canvas); // 使用webgl的上下文
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // 在WebGL系统内建立和初始化着色器
    if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    var n = initVertexBuffers(gl);
    if(n<0){
        console.log('Failed to get enough points');
        return;
    }

    gl.drawArrays(gl.POINTS, 0, n); // 绘制 mode, first, count
}

var FSIZE = 4;

function initVertexBuffers(gl) {
    var verticesColors = new Float32Array([
        // 顶点坐标和颜色
        0.0, 0.5, 1.0, 0.0, 0.0,
       -0.5,-0.5, 0.0, 1.0, 0.0,
        0.5,-0.5, 0.0, 0.0, 1.0
    ]);
    var n = 3;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 创建缓冲区对象
    var vertexColorBuffer = gl.createBuffer();

    // 将顶点坐标写入缓冲区对象并开启
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
    gl.enableVertexAttribArray(a_Color); // 开启缓冲区分配

    return n;
}