// RotateObject.js
// 顶点着色器程序
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_MvpMatrix;
    varying vec4 v_Color;
    void main() {
        gl_Position = u_MvpMatrix * a_Position;
        v_Color = a_Color;
    }
`;

// 片元着色器程序
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec4 v_Color;
    void main() {
        gl_FragColor = v_Color;
    }
`;

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

    var currentAngle = [0.0, 0.0]; // [绕X轴旋转角度，绕Y轴旋转角度]
    initEventHandlers(canvas, currentAngle);

    var viewProjMatrix = new Matrix4(); // 模型矩阵
    // 计算视图矩阵和投影矩阵
    viewProjMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    viewProjMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);
    
    // 获取u_ViewMatrix变量的存储地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    // 设置视点、视线和上方向

    var tick = function() {
        draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix);
        requestAnimationFrame(tick, canvas);
    }
    tick();
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

function initEventHandlers(canvas, currentAngle) {
    var dragging = false; // 是否在拖动
    var lastX = -1, lastY = -1; // 鼠标的最后位置

    canvas.onmousedown = function(env) { // 按下鼠标
        var x = env.clientX, y = env.clientY;
        // 如果鼠标在<canvas>内就开始拖动
        var rect = env.target.getBoundingClientRect();
        if(rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x;
            lastY = y;
            dragging = true;
        }
    };
    // 松开鼠标
    canvas.onmouseup = function(env) { dragging = false; }

    canvas.onmousemove = function(env) { // 移动鼠标
        var x = env.clientX, y = env.clientY;
        if (dragging) {
            var factor = 100/canvas.height; // 旋转因子
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);
            // 将沿Y轴旋转的角度控制在-90到90度之间
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
            currentAngle[1] = currentAngle[1] + dx;
        }
        lastX = x;
        lastY = y;
    };
}

var g_MvpMatrix = new Matrix4(); // 模型视图投影矩阵
function draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix) {
    // 计算模型视图投影矩阵
    g_MvpMatrix.set(viewProjMatrix);
    g_MvpMatrix.rotate(currentAngle[0], 1.0, 0.0, 0.0); // X轴
    g_MvpMatrix.rotate(currentAngle[1], 0.0, 1.0, 0.0); // Y轴
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_MvpMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}