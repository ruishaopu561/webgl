// ProgramObject.js
// 顶点着色器，绘制单色立方体
var SOLID_VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal; // 法向量
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_NormalMatrix;
    varying vec4 v_Color;
    void main() {
        vec3 lightDirection = vec3(0.0, 0.0, 1.0);
        vec4 color = vec4(0.0, 1.0, 1.0, 1.0);
        gl_Position = u_MvpMatrix * a_Position;
        vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
        float nDotL = max(dot(normal, lightDirection), 0.0);
        v_Color = vec4(color.rgb * nDotL, color.a);
    }
`;

// 片元着色器，绘制单色立方体
var SOLID_FSHADER_SOURCE = `
    #ifdef GL_ES
    precision mediump float;
    #endif
    varying vec4 v_Color;
    void main() {
        gl_FragColor = v_Color;
    }
`;

// 顶点着色器，绘制纹理立方体
var TEXTURE_VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    attribute vec2 a_TexCoord;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_NormalMatrix;
    varying float v_NdotL;
    varying vec2 v_TexCoord;
    void main() {
        vec3 lightDirection = vec3(0.0, 0.0, 1.0);
        gl_Position = u_MvpMatrix * a_Position; // 位置坐标
        vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
        v_NdotL = max(dot(normal, lightDirection), 0.0);
        v_TexCoord = a_TexCoord;
    }
`;

// 片元着色器，绘制纹理立方体
var TEXTURE_FSHADER_SOURCE = `
    #ifdef GL_ES
    precision mediump float;
    #endif
    uniform sampler2D u_Sampler;
    varying vec2 v_TexCoord; 
    varying float v_NdotL;
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

    // 初始化着色器
    var solidProgram = createProgram(gl, SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE);
    var texProgram = createProgram(gl, TEXTURE_VSHADER_SOURCE, TEXTURE_FSHADER_SOURCE);

    // 获取绘制单色立方体着色器的变量
    solidProgram.a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
    solidProgram.a_Normal = gl.getAttribLocation(solidProgram, 'a_Normal');
    solidProgram.u_MvpMatrix = gl.getUniformLocation(solidProgram, 'u_MvpMatrix');
    solidProgram.u_NormalMatrix = gl.getUniformLocation(solidProgram, 'u_NormalMatrix');

    // 获得绘制纹理立方体着色器的变量
    texProgram.a_Position = gl.getAttribLocation(texProgram, 'a_Position');
    texProgram.a_Normal = gl.getAttribLocation(texProgram, 'a_Normal');
    texProgram.a_TexCoord = gl.getAttribLocation(texProgram, 'a_TexCoord');
    texProgram.u_MvpMatrix = gl.getUniformLocation(texProgram, 'u_MvpMatrix');
    texProgram.u_NormalMatrix = gl.getUniformLocation(texProgram, 'u_NormalMatrix');
    texProgram.u_Sampler = gl.getUniformLocation(texProgram, 'u_Sampler');

    // 设置顶点信息
    var cube = initVertexBuffers(gl);
    // 设置纹理
    var texture = initTextures(gl, texProgram);
    

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 开启隐藏面消除
    gl.enable(gl.DEPTH_TEST);

    // 计算视图投影矩阵
    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(30.0, canvas.width/canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(0.0, 0.0, 15.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);


    // 开始绘制
    var currentAngle = 0.0;
    var tick = function() {
        currentAngle = animate(currentAngle);

        // 清空颜色和深度缓冲区
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // 绘制单色立方体
        drawSolidCube(gl, solidProgram, cube, -2.0, currentAngle, viewProjMatrix);
        // 绘制纹理立方体
        drawTexCube(gl, texProgram, cube, texture, 2.0, currentAngle, viewProjMatrix);

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

    var texCoords = new Float32Array([
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

    var o = new Object(); // 使用该对象返回多个缓冲区对象

    // 将顶点信息写入缓冲区对象
    o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.normalBuffer = initArrayBufferForLaterUse(gl, normals, 3, gl.FLOAT);
    o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
    o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);

    o.numIndices = indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

function initTextures(gl, program) {
    var texture = gl.createTexture(); // 创建一个纹理对象
    
    var image = new Image(); // 创建一个image对象
    if(!image) {
        console.log('Failed to create image object');
        return null;
    }

    // 注册对象加载事件的响应函数
    image.onload = function(){ 
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); //对纹理图像进行y轴反转
        gl.activeTexture(gl.TEXTURE0); // 开启0号纹理单元
        gl.bindTexture(gl.TEXTURE_2D, texture); // 向target绑定纹理对象
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // 配置纹理参数
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image); // 配置纹理图像

        gl.useProgram(program);
        gl.uniform1i(program.u_Sampler, 0); // 将0号纹理传递给着色器
        gl.bindTexture(gl.TEXTURE_2D, null); // 解绑buffer
    };

    image.src = '../ProgramObject/resources/sky.jpg';

    return texture;
}

function initArrayBufferForLaterUse(gl, data, num, type) {
    var buffer = gl.createBuffer(); // 创建缓冲区对象
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }

    // 将数据写入缓冲区对象
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // 保存一些数据供将来分配给attribute变量时使用
    buffer.num = num;
    buffer.type = type;

    return buffer;
}

function initElementArrayBufferForLaterUse(gl, data, type) {
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    buffer.type = type;

    return buffer;
}

//绘制单色的立方体
function drawSolidCube(gl, program, o, x, angle, viewProjMatrix) {
    gl.useProgram(program);   // Tell that this program object is used

    // Assign the buffer objects and enable the assignment
    initAttributeVariable(gl, program.a_Position, o.vertexBuffer); // Vertex coordinates
    initAttributeVariable(gl, program.a_Normal, o.normalBuffer);   // Normal
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);  // Bind indices

    drawCube(gl, program, o, x, angle, viewProjMatrix);   // Draw
}

// 绘制纹理立方体
function drawTexCube(gl, program, o, texture, x, angle, viewProjMatrix) {
    gl.useProgram(program); // 告诉WebGL使用这个程序对象

    // 分配缓冲区对象并开启attribute变量
    initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
    initAttributeVariable(gl, program.a_Normal, o.normalBuffer);
    initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

    // 将纹理对象绑定到0号纹理单元
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    drawCube(gl, program, o, x, angle, viewProjMatrix); // 绘制
}

// Assign the buffer objects and enable the assignment
function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

function drawCube(gl, program, o, x, angle, viewProjMatrix) {
    var modelMatrix = new Matrix4();
    var normalMatrix = new Matrix4();
    var mvpMatrix = new Matrix4();

    // 计算模型矩阵
    modelMatrix.setTranslate(x, 0.0, 0.0);
    modelMatrix.rotate(20.0, 1.0, 0.0, 0.0);
    modelMatrix.rotate(angle, 0.0, 1.0, 0.0);
    
    // 计算法线变换矩阵
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, normalMatrix.elements);
    
    // 计算模型视图投影矩阵
    mvpMatrix.set(viewProjMatrix);
    mvpMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);

    // 开始绘制
    gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);
}

var ANGLE_STEP = 30;   // The increments of rotation angle (degrees)
var last = Date.now(); // Last time that this function was called
function animate(angle) {
    var now = Date.now();   // Calculate the elapsed time
    var elapsed = now - last;
    last = now;
    // Update the current rotation angle (adjusted by the elapsed time)
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle % 360;
}