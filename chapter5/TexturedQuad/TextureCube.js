// ProgramObject.js
// 顶点着色器，绘制纹理立方体
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    attribute vec2 a_TexCoord;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_NormalMatrix;
    varying float v_NdotL;
    varying vec2 v_TexCoord;

    void main() {
        gl_Position = u_MvpMatrix * a_Position;
        vec3 lightDirection = vec3(0.0, 0.0, 1.0);
        vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
        v_NdotL = max(dot(normal, lightDirection), 0.0);
        v_TexCoord = a_TexCoord;
    }
`;

// 片元着色器，绘制纹理立方体
var FSHADER_SOURCE = `
    #ifdef GL_ES
    precision mediump float;
    #endif

    uniform sampler2D u_Sampler; // initTexture里赋值
    varying float v_NdotL;
    varying vec2 v_TexCoord; 

    void main() {
        vec4 color = texture2D(u_Sampler, v_TexCoord);
        gl_FragColor = vec4(color.rgb * v_NdotL, color.a);
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
        console.log('Failed to initialize shaders.');
        return;
    }

    var n = initVertexBuffers(gl);
    if(n < 0) {
        console.log('Failed to initialize vertex buffers');
        return;
    }

    if(!initTextures(gl)) {
        console.log('Failed to initialize textures');
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 开启隐藏面消除
    gl.enable(gl.DEPTH_TEST);

    // 开始绘制
    var currentAngle = 0.0;
    var tick = function() {
        currentAngle = animate(currentAngle);

        // 清空颜色和深度缓冲区
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // 绘制纹理立方体
        drawCube(gl, n, currentAngle, canvas.width/canvas.height);

        window.requestAnimationFrame(tick, canvas);
    };
    tick();
}

function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    var vertices = new Float32Array([ // 顶点坐标
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0,-1.0, 1.0,  1.0,-1.0, 1.0, //front面 v0123
        1.0, 1.0, 1.0,  1.0,-1.0, 1.0,  1.0,-1.0,-1.0,  1.0, 1.0,-1.0, //right v0345
        1.0, 1.0, 1.0,  1.0, 1.0,-1.0, -1.0, 1.0,-1.0, -1.0, 1.0, 1.0, //up v0561
       -1.0, 1.0, 1.0, -1.0,-1.0, 1.0, -1.0,-1.0,-1.0, -1.0, 1.0,-1.0, //left v1276
       -1.0,-1.0, 1.0,  1.0,-1.0, 1.0,  1.0,-1.0,-1.0, -1.0,-1.0,-1.0, //down v2347
        1.0,-1.0,-1.0,  1.0, 1.0,-1.0, -1.0, 1.0,-1.0, -1.0,-1.0,-1.0 //back v4567
    ]);

    var normals = new Float32Array([ // 法向量
        0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
        1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
        0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
       -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v2-v7-v6 left
        0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v2-v3-v4-v7 down
        0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v5-v6-v7 back
    ]);

    var texCoords = new Float32Array([ // 面纹理
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
    ]);

    var indices = new Uint8Array([ // 顶点索引
         0, 1, 2,  0, 2, 3, // 前
         4, 5, 6,  4, 6, 7, // 右
         8, 9,10,  8,10,11, // 上
        12,13,14, 12,14,15, // 左
        16,17,18, 16,18,19, // 下
        20,21,22, 20,22,23, // 后
    ]);

    if(!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')){ return -1; }
    if(!initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_Normal')){ return -1; }
    if(!initArrayBuffer(gl, texCoords, 2, gl.FLOAT, 'a_TexCoord')){ return -1; }
    if(!initElementArrayBuffer(gl, indices)){ return -1; }

    return indices.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {
    var buffer = gl.createBuffer(); // 创建缓冲区对象
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    // 将数据写入缓冲区对象
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);

    return true;
}

function initElementArrayBuffer(gl, data) {
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    return true;
}

function initTextures(gl) {
    var texture = gl.createTexture(); // 创建一个纹理对象
    
    var image = new Image(); // 创建一个image对象
    if(!image) {
        console.log('Failed to create image object');
        return false;
    }

    // 获取u_Sampler的存储位置
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');

    // 注册对象加载事件的响应函数
    image.onload = function(){ 
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); //对纹理图像进行y轴反转
        gl.activeTexture(gl.TEXTURE0); // 开启0号纹理单元
        gl.bindTexture(gl.TEXTURE_2D, texture); // 向target绑定纹理对象
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // 配置纹理参数
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image); // 配置纹理图像
        gl.uniform1i(u_Sampler, 0); // 将0号纹理传递给着色器
    };

    image.src = './resources/sky.jpg';

    return true;
}

function drawCube(gl, n, angle, wh) {
    var modelMatrix = new Matrix4();
    var normalMatrix = new Matrix4();
    var mvpMatrix = new Matrix4();

    // 计算模型矩阵
    modelMatrix.setTranslate(0.0, 0.0, 0.0);
    modelMatrix.rotate(20.0, 1.0, 0.0, 0.0);
    modelMatrix.rotate(angle, 0.0, 1.0, 0.0);
    
    // 计算法线变换矩阵
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // 计算模型视图投影矩阵
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    mvpMatrix.setPerspective(30.0, wh, 1.0, 100.0);
    mvpMatrix.lookAt(0.0, 0.0, 15.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    mvpMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // 开始绘制
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

var ANGLE_STEP = 30;
var last = Date.now();
function animate(angle) {
    var now = Date.now();
    var elapsed = now - last;
    last = now;
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle % 360;
}