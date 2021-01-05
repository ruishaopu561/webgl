// MultiAttributeSize.js
// 顶点着色器程序
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute float a_PointSize;\n' +
    'void main() {\n' +
    'gl_Position = a_Position;\n' + // 位置坐标
    'gl_PointSize = a_PointSize;\n' + // 设置尺寸
    '}\n';

// 片元着色器程序
var FSHADER_SOURCE = 
    'void main() {\n' +
    'gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);\n' + // 设置颜色
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

function initVertexBuffers(gl) {
    var vertices = new Float32Array([
        0.0, 0.5, -0.5, -0.5, 0.5, -0.5
    ]);
    var n=3;

    var sizes = new Float32Array([
        10.0, 20.0, 30.0 // 点的尺寸
    ])

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 创建缓冲区对象
    var vertexBuffer = gl.createBuffer();
    var sizeBuffer = gl.createBuffer();

    // 将顶点坐标写入缓冲区对象并开启
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // 将顶点尺寸写入缓冲区对象并开启
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');

    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_PointSize);

    return n;
}