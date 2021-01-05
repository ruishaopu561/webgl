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
    var vertices = new Float32Array([ // 顶点坐标
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0,-1.0, 1.0,  1.0,-1.0, 1.0, //front面 v0-4
        1.0, 1.0, 1.0,  1.0,-1.0, 1.0,  1.0,-1.0,-1.0,  1.0, 1.0,-1.0, //right v0345
        1.0, 1.0, 1.0,  1.0, 1.0,-1.0, -1.0, 1.0,-1.0, -1.0, 1.0, 1.0, //up v0561
       -1.0, 1.0, 1.0, -1.0,-1.0, 1.0, -1.0,-1.0,-1.0, -1.0, 1.0,-1.0, //left 
       -1.0,-1.0, 1.0,  1.0,-1.0, 1.0,  1.0,-1.0,-1.0, -1.0,-1.0,-1.0, //down
        1.0,-1.0,-1.0,  1.0, 1.0,-1.0, -1.0, 1.0,-1.0, -1.0,-1.0,-1.0 //back
    ]);

    var colors = new Float32Array([ // 颜色
        0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, //front
        0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, //right
        1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, //up
        1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, //left
        1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, //btm
        0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0 //back
    ]);

    var indices = new Uint8Array([ // 顶点索引
         0,  1,  2,  0,  2,  3, // 前
         4,  5,  6,  4,  6,  7, // 右
         8,  9, 10,  8, 10, 11, // 上
        12, 13, 14, 12, 14, 15, // 
        16, 17, 18, 16, 18, 19, //
        20, 21, 22, 20, 22, 23,  // 后
    ]);

    if(!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')) { return -1; }
    if(!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color')) { return -1; }

    // 创建缓冲区对象
    var indexBuffer = gl.createBuffer();
    // 将顶点索引数据写入缓冲区对象
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {
    var buffer = gl.createBuffer(); // 创建缓冲区对象
    if(!buffer){
        console.log('Failed to create buffer');
        return false;
    }

    // 将数据写入缓冲区对象
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // 将缓冲区对象分配给attribute变量
    var a_attribute = gl.getAttribLocation(gl.program, attribute);

    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // 将缓冲区对象分配给attribute变量
    gl.enableVertexAttribArray(a_attribute);

    return true;
}