// PickFace.js
// 顶点着色器程序
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute float a_Face; // 表面编号（不可使用int类型）
    uniform mat4 u_MvpMatrix;
    uniform int u_PickedFace; // 被选中表面的编号
    varying vec4 v_Color;
    void main() {
        gl_Position = u_MvpMatrix * a_Position;
        int face = int(a_Face); // 转为int类型
        vec3 color = (face == u_PickedFace) ? vec3(1.0) : a_Color.rgb;
        if (u_PickedFace == 0) {
            v_Color = vec4(color, a_Face/255.0);  // 被点击时，用a存储面信息
        } else {
            v_Color = vec4(color, a_Color.a);
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

    var u_PickedFace = gl.getUniformLocation(gl.program, 'u_PickedFace');
    gl.uniform1i(u_PickedFace, -1); // 将false传给u_Clicked变量

    // 注册事件的响应函数
    canvas.onmousedown = function(env) { // 按下鼠标
        var x = env.clientX, y = env.clientY;
        // 如果鼠标在<canvas>内就开始拖动
        var rect = env.target.getBoundingClientRect();
        if(rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
            var face = checkFace(gl, n, x_in_canvas, y_in_canvas, u_PickedFace, viewProjMatrix, u_MvpMatrix);
            gl.uniform1i(u_PickedFace, face);
            draw(gl, n, viewProjMatrix, u_MvpMatrix);
        }
    };

    var viewProjMatrix = new Matrix4(); // 模型矩阵
    // 计算视图矩阵和投影矩阵
    viewProjMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    viewProjMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);
    
    // 获取u_ViewMatrix变量的存储地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');

    var tick = function() {
        draw(gl, n, viewProjMatrix, u_MvpMatrix);
        requestAnimationFrame(tick, canvas);
    }
    tick();
}

function initVertexBuffers(gl) {
    var vertices = new Float32Array([
        1.0,  1.0,  1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0,  1.0, -1.0,  1.0, //front面 v0-4
        1.0,  1.0,  1.0,  1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0,  1.0, -1.0, //right v0345
        1.0,  1.0,  1.0,  1.0,  1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,  1.0, //up v0561
       -1.0,  1.0,  1.0, -1.0, -1.0,  1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0, //left 
       -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0, -1.0, -1.0, -1.0, -1.0, -1.0, //down
        1.0, -1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0, -1.0, -1.0, -1.0, -1.0 //back
    ]);

    var colors = new Float32Array([ // 顶点颜色
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, //front
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, //right
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, //up
        1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, //left
        1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, //btm
        0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0 //back
    ]);

   var indices = new Uint8Array([
        0,  1,  2,  0,  2,  3,
        4,  5,  6,  4,  6,  7,
        8,  9, 10,  8, 10, 11,
       12, 13, 14, 12, 14, 15,
       16, 17, 18, 16, 18, 19,
       20, 21, 22, 20, 22, 23,
   ]);

    var faces = new Uint8Array([ // 表面编号
        1, 1, 1, 1, // v0-v1-v2-v3 前表面
        2, 2, 2, 2, // v0-v3-v4-v5 右表面
        3, 3, 3, 3,
        4, 4, 4, 4,
        5, 5, 5, 5,
        6, 6, 6, 6,
    ])

    // 创建缓冲区对象
    var indexBuffer = gl.createBuffer();
    // 将顶点索引数据写入缓冲区对象*
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    if(!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')){ return -1; }
    if(!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color')){ return -1; }
    if(!initArrayBuffer(gl, faces, 1, gl.UNSIGNED_BYTE, 'a_Face')){ return -1; }

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

function checkFace(gl, n, x, y, u_PickedFace, viewProjMatrix, u_MvpMatrix) {
    var pixels = new Uint8Array(4); // 存储像素值的数组
    gl.uniform1i(u_PickedFace, 0); // 将表面编号写入a分量
    draw(gl, n, viewProjMatrix, u_MvpMatrix);
    // 读取(x, y)处的像素颜色，pixels[3]中存储了表面编号
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    console.log(pixels);
    return pixels[3];
}

var g_MvpMatrix = new Matrix4(); // 模型视图投影矩阵
function draw(gl, n, viewProjMatrix, u_MvpMatrix) {
    // 计算模型视图投影矩阵
    g_MvpMatrix.set(viewProjMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_MvpMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}