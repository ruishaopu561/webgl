// PickObject.js
// 顶点着色器程序
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_MvpMatrix;
    uniform bool u_Clicked; // 鼠标按下
    varying vec4 v_Color;
    void main() {
        gl_Position = u_MvpMatrix * a_Position;
        if (u_Clicked) {
            v_Color = vec4(1.0, 0.0, 0.0, 1.0);
        } else {
            v_Color = a_Color;
        }
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
    var hud = document.getElementById('hud');

    // 获取WebGL绘图上下文
    var gl = getWebGLContext(canvas);
    if(!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    var ctx = hud.getContext('2d');
    if(!ctx) {
        console.log('Failed to get the rendering context for HUD');
        return;
    }

    // 注册事件响应函数
    hud.onmousedown = function(env) {
        var x = env.clientX, y = env.clientY;
        var rect = env.target.getBoundingClientRect();
        if(rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
            check(gl, n, x_in_canvas, y_in_canvas, u_Clicked, viewProjMatrix, u_MvpMatrix);
        }
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

    var u_Clicked = gl.getUniformLocation(gl.program, 'u_Clicked');
    gl.uniform1i(u_Clicked, 0); // 将false传给u_Clicked变量

    var currentAngle = 0.0;
    // 注册事件的响应函数
    canvas.onmousedown = function(env) { // 按下鼠标
        var x = env.clientX, y = env.clientY;
        // 如果鼠标在<canvas>内就开始拖动
        var rect = env.target.getBoundingClientRect();
        if(rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
            var picked = check(gl, n, x_in_canvas, y_in_canvas, u_Clicked, viewProjMatrix, u_MvpMatrix);
            if (picked) {
                alert('The cube was selected! ');
            }
        }
    };

    var viewProjMatrix = new Matrix4(); // 模型矩阵
    // 计算视图矩阵和投影矩阵
    viewProjMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    viewProjMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);
    
    // 获取u_ViewMatrix变量的存储地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');

    var tick = function() {
        draw2D(ctx, currentAngle);
        draw(gl, n, viewProjMatrix, u_MvpMatrix);
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

function check(gl, n, x, y, u_Clicked, viewProjMatrix, u_MvpMatrix) {
    var picked = false;
    gl.uniform1i(u_Clicked, 1); // 将立方体绘制为红色
    draw(gl, n, viewProjMatrix, u_MvpMatrix);
    // 读取点击位置的像素颜色值
    var pixels = new Uint8Array(4); // 存储像素的数组
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels); // 读到(x, y)坐标确定的像素值
    
    if (pixels[0] == 255) { // 这个时候立方体是红色，因此第一个颜色分量是255
        picked = true;
    }

    gl.uniform1i(u_Clicked, 0); // 将false传给u_Clicked变量以重绘正常状态的立方体
    draw(gl, n, viewProjMatrix, u_MvpMatrix);

    return picked;
}

var g_MvpMatrix = new Matrix4(); // 模型视图投影矩阵
function draw(gl, n, viewProjMatrix, u_MvpMatrix) {
    // 计算模型视图投影矩阵
    g_MvpMatrix.set(viewProjMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_MvpMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function draw2D(ctx, currentAngle) {
    ctx.clearRect(0, 0, 400, 400); // 清除<hud>
    // 用白色的线条绘制三角形
    ctx.beginPath();
    ctx.moveTo(120, 10); ctx.lineTo(200, 150); ctx.lineTo(40, 150);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)'; // 设置线条颜色
    ctx.stroke();
    // 绘制白色的文本
    ctx.font = '18px "Times New Roman"';
    ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // 设置文本颜色
    ctx.fillText('HUD: Head Up Display', 40, 180);
    ctx.fillText('Triangle is drawn by Hud API', 40, 200);
    ctx.fillText('Cube is drawn by WebGL API', 40, 220);
    ctx.fillText('Current Angle: ' + Math.floor(currentAngle), 40, 240);
}