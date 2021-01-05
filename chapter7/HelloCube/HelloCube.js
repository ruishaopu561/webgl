// HelloCube.js
// 顶点着色器程序
var VSHADER_SOURCE = 
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';

// 片元着色器程序
var FSHADER_SOURCE = 
    'precision mediump float;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

function main() {
    var canvas = document.getElementById('webgl');

    var gl = getWebGLContext(canvas);
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }

    // 设置顶点坐标和颜色
    var n = initVertexBuffers(gl);
    if(n < 0){
        console.log('Failed to initialize enough points');
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 开启隐藏面消除
    gl.enable(gl.DEPTH_TEST);

    // 获取u_ViewMatrix变量的存储地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');

    // 设置视点、视线和上方向
    var mvpMatrix = new Matrix4(); // 模型矩阵
    // 计算视图矩阵和投影矩阵
    mvpMatrix.setPerspective(30, 1, 1, 100);
    mvpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);

    // 将模型矩阵、视图矩阵和投影矩阵传给相应的uniform变量
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // 清空颜色和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 绘制立方体
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function initVertexBuffers(gl) {
    var verticesColors = new Float32Array([
        // 顶点坐标和颜色
         1.0,  1.0,  1.0, 1.0, 1.0, 1.0, // v0
        -1.0,  1.0,  1.0, 1.0, 1.0, 0.0, // v1
        -1.0, -1.0,  1.0, 1.0, 0.0, 0.0, // v2
         1.0, -1.0,  1.0, 1.0, 0.0, 1.0, // v3
         1.0, -1.0, -1.0, 0.0, 0.0, 1.0, // v4
         1.0,  1.0, -1.0, 0.0, 1.0, 1.0, // v5
        -1.0,  1.0, -1.0, 0.0, 1.0, 0.0, // v6
        -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, // v7
    ]);

    // 顶点索引
    var indices = new Uint8Array([
        0, 1, 2, 0, 2, 3, // 前
        0, 3, 4, 0, 4, 5, // 右
        0, 5, 6, 0, 6, 1, // 上
        1, 6, 7, 1, 7, 2, // 左
        7, 4, 3, 7, 3, 2, // 下
        4, 7, 6, 4, 6, 5, // 后
    ]);

    // 创建缓冲区对象
    var vertexColorBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var FSIZE = verticesColors.BYTES_PER_ELEMENT;

    // 将缓冲区内顶点坐标数据分配给a_Position并开启之
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    // 将顶点索引数据写入缓冲区对象*
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}