// ProgramObject.js
// 顶点着色器，绘制单色立方体
var SOLID_VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal; // 法向量
    attribute vec4 a_Color;
    uniform mat4 u_MvpMatrix;
    uniform vec3 u_LightColor; // 光线颜色
    uniform vec3 u_LightDirection; // 归一化的世界坐标
    varying vec4 v_Color;
    void main() {
        gl_Position = u_MvpMatrix * a_Position;
        vec3 normal = normalize(vec3(a_Normal));
        float nDotL = max(dot(u_LightDirection, normal), 0.0);
        vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL;
        v_Color = vec4(diffuse, a_Color.a);
    }
`;

// 片元着色器，绘制单色立方体
var SOLID_FSHADER_SOURCE = `
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

    // 设置顶点坐标和颜色
    var n = initVertexBuffers(gl);
    if(n < 0){
        console.log('Failed to initialize enough points');
        return;
    }

    var viewProjMatrix = new Matrix4(); // 模型矩阵
    // 计算视图矩阵和投影矩阵
    viewProjMatrix.setPerspective(30, 1, 1, 100);
    viewProjMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);

    // 初始化着色器
    var solidProgram = createProgram(gl, SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE);

    // 获取绘制单色立方体着色器的变量
    solidProgram.a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
    solidProgram.a_Normal = gl.getAttribLocation(solidProgram, 'a_Normal');
    solidProgram.a_Color = gl.getAttribLocation(solidProgram, 'a_Color');
    solidProgram.u_MvpMatrix = gl.getUniformLocation(solidProgram, 'u_MvpMatrix');
    solidProgram.u_LightColor = gl.getUniformLocation(solidProgram, 'u_LightColor');
    solidProgram.u_LightDirection = gl.getUniformLocation(solidProgram, 'u_LightDirection');

    initLight(gl, solidProgram);

    // 设置顶点信息
    var cube = initVertexBuffers(gl, solidProgram);
    // 开始绘制
    var tick = function() {
        // 绘制单色立方体
        drawSolidCube(gl, solidProgram, cube, -2.0, viewProjMatrix);

        window.requestAnimationFrame(tick, canvas);
    };
    tick();
}

function initLight(gl, program) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 开启隐藏面消除
    gl.enable(gl.DEPTH_TEST);
    // 清空颜色和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);
    gl.vertexAttrib3f(program.a_Color, 1.0, 0.0, 0.0);
    // 设置光线颜色（白色）
    gl.uniform3f(program.u_LightColor, 1.0, 1.0, 1.0);
    // 设置光线方向(世界坐标系下的)
    var lightDirection = new Vector3([0.5, 3.0, 4.0]);
    lightDirection.normalize(); // 归一化
    gl.uniform3fv(program.u_LightDirection, lightDirection.elements);
}

function initVertexBuffers(gl, program) {
    gl.useProgram(program);

    var vertices = new Float32Array([ // 顶点坐标
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0,-1.0, 1.0,  1.0,-1.0, 1.0, //front面 v0-4
        1.0, 1.0, 1.0,  1.0,-1.0, 1.0,  1.0,-1.0,-1.0,  1.0, 1.0,-1.0, //right v0345
        1.0, 1.0, 1.0,  1.0, 1.0,-1.0, -1.0, 1.0,-1.0, -1.0, 1.0, 1.0, //up v0561
       -1.0, 1.0, 1.0, -1.0,-1.0, 1.0, -1.0,-1.0,-1.0, -1.0, 1.0,-1.0, //left 
       -1.0,-1.0, 1.0,  1.0,-1.0, 1.0,  1.0,-1.0,-1.0, -1.0,-1.0,-1.0, //down
        1.0,-1.0,-1.0,  1.0, 1.0,-1.0, -1.0, 1.0,-1.0, -1.0,-1.0,-1.0 //back
    ]);

    var normals = new Float32Array([ // 法向量
        0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
        1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
        0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
       -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
        0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
        0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
    ]);

    var texCoords = new Float32Array([
        // 顶点坐标，纹理坐标
       -0.5, 0.5, 0.0, 1.0,
       -0.5,-0.5, 0.0, 0.0,
        0.5, 0.5, 1.0, 1.0,
        0.5,-0.5, 1.0, 0.0,
    ]);

    var indices = new Uint8Array([ // 顶点索引
         0,  1,  2,  0,  2,  3, // 前
         4,  5,  6,  4,  6,  7, // 右
         8,  9, 10,  8, 10, 11, // 上
        12, 13, 14, 12, 14, 15, // 
        16, 17, 18, 16, 18, 19, //
        20, 21, 22, 20, 22, 23  // 后
    ]);

    var o = new Object(); // 使用该对象返回多个缓冲区对象

    // 将顶点信息写入缓冲区对象
    o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.normalBuffer = initArrayBufferForLaterUse(gl, normals, 3, gl.FLOAT);
    o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
    o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);

    o.numIndices = indices.length;
    return o;
}

function initArrayBufferForLaterUse(gl, data, num, type) {
    var buffer = gl.createBuffer(); // 创建缓冲区对象

    // 将数据写入缓冲区对象
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // 保存一些数据供将来分配给attribute变量时使用
    buffer.num = num;
    buffer.type = type;

    return buffer;
}

function initElementArrayBufferForLaterUse(gl, indices, type) {
    var buffer = gl.createBuffer();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    buffer.type = type;

    return buffer;
}

function drawSolidCube(gl, program, o, x, viewProjMatrix) {
    gl.useProgram(program); // 告诉WebGL使用这个程序对象

    // 分配缓冲区对象并开启attribute变量
    initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
    initAttributeVariable(gl, program.a_Normal, o.normalBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

    drawCube(gl, program, o, x, viewProjMatrix);
}

// Assign the buffer objects and enable the assignment
function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

function drawCube(gl, program, o, x, viewProjMatrix) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    var mvpMatrix = new Matrix4(viewProjMatrix);
    mvpMatrix.translate(x, 0.0, 0.0);

    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);

    gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);
}