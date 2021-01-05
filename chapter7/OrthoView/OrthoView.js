// LookAtTriangles.js
// 顶点着色器程序
var VSHADER_SOURCE = 
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' + 
    'uniform mat4 u_ProjMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_ProjMatrix * a_Position;\n' +
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

    // 获取u_ViewMatrix变量的存储地址
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    // 设置视点、视线和上方向
    var projMatrix = new Matrix4();

    // 获取nearFar元素
    var nf = document.getElementById('nearFar');
    // 注册键盘事件响应函数
    document.onkeydown = function (env) { keydown(env, gl, n, u_ProjMatrix, projMatrix, nf); };

    // 绘制三角形
    draw(gl, n, u_ProjMatrix, projMatrix, nf);
}

function initVertexBuffers(gl) {
    var verticesColors = new Float32Array([
         0.0,  0.5, -0.4, 0.4, 1.0, 0.4, // 绿色三角形在最后面
        -0.5, -0.5, -0.4, 0.4, 1.0, 0.4, 
         0.5, -0.5, -0.4, 1.0, 0.4, 0.4,

         0.5,  0.4, -0.2, 1.0, 0.4, 0.4, // 黄色三角形在中间
        -0.5,  0.4, -0.2, 1.0, 1.0, 0.4, 
         0.0, -0.6, -0.2, 1.0, 1.0, 0.4,

         0.0,  0.5,  0.0, 0.4, 0.4, 1.0, // 蓝色三角形在最前面
        -0.5, -0.5,  0.0, 0.4, 0.4, 1.0, 
         0.5, -0.5,  0.0, 1.0, 0.4, 0.4,
    ]);
    var n = 9;

    var FSIZE = 4;

    // 创建缓冲区对象
    var vertexColorBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    return n;
}

// 视点与近、远裁剪面的距离
var g_near = 0.0, g_far = 0.5;
function keydown(env, gl, n, u_ProjMatrix, projMatrix, nf) {
    switch (env.keyCode) {
        case 39: g_near += 0.01; break; // 按下右方向键
        case 37: g_near -= 0.01; break; // 按下左方向键
        case 38: g_far += 0.01; break; // 按下上方向键
        case 40: g_far -= 0.01; break; // 按下下方向键    
        default: return; // 按下了其他键
    }

    draw(gl, n, u_ProjMatrix, projMatrix, nf);
}

function draw(gl, n, u_ProjMatrix, projMatrix, nf) {
    // 使用矩阵设置可视空间
    projMatrix.setOrtho(-1, 1, -1, 1, g_near, g_far);

    // 将投影矩阵传给u_ProjMatrix变量
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    nf.innerHTML = 'near: ' + Math.round(g_near * 100)/100 + ', far: ' + Math.round(g_far * 100)/100;
    
    gl.drawArrays(gl.TRIANGLES, 0, n); // 绘制三角形
}