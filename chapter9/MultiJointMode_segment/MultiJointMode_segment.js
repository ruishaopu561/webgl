// MultiJointMode_segment.js
// 顶点着色器程序
var VSHADER_SOURCE = 
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' + // 法向量
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform vec3 u_LightColor;\n' + // 光线颜色
    'uniform vec3 u_LightDirection;\n' + // 归一化的世界坐标
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    // 对法向量进行归一化
    '  vec3 normal = normalize(vec3(a_Normal));\n' +
    // 计算光线方向和法向量的点积
    '  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
    // 计算漫反射光的颜色
    '  vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL;\n' +
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
    if(n < 0) {
        console.log('Failed to initialize enough points');
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 开启隐藏面消除
    gl.enable(gl.DEPTH_TEST);
    // 清空颜色和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 设置光线颜色（白色）
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);

    // 设置光线方向(世界坐标系下的)
    var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    var lightDirection = new Vector3([0.5, 3.0, 4.0]);
    lightDirection.normalize(); // 归一化
    gl.uniform3fv(u_LightDirection, lightDirection.elements);

    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(50.0, canvas.width/canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(20.0, 10.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    // 注册键盘事件响应函数
    document.onkeydown = function(env) {
        keydown(env, gl, n, a_Position, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
    }

    draw(gl, n, a_Position, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

var g_baseBuffer = null; // base的缓冲区对象
var g_arm1Buffer = null; // arm1的缓冲区对象
var g_arm2Buffer = null; // arm2的缓冲区对象
var g_palmBuffer = null; // palm的缓冲区对象
var g_fingerBuffer = null; // finger1和finger2的缓冲区对象

function initVertexBuffers(gl) {
    vertices_base = new Float32Array([ // Base(10x2x10)
        5.0, 2.0, 5.0, -5.0, 2.0, 5.0, -5.0, 0.0, 5.0,  5.0, 0.0, 5.0, // v0-v1-v2-v3 front
        5.0, 2.0, 5.0,  5.0, 0.0, 5.0,  5.0, 0.0,-5.0,  5.0, 2.0,-5.0, // v0-v3-v4-v5 right
        5.0, 2.0, 5.0,  5.0, 2.0,-5.0, -5.0, 2.0,-5.0, -5.0, 2.0, 5.0, // v0-v5-v6-v1 up
        -5.0, 2.0, 5.0, -5.0, 2.0,-5.0, -5.0, 0.0,-5.0, -5.0, 0.0, 5.0, // v1-v6-v7-v2 left
        -5.0, 0.0,-5.0,  5.0, 0.0,-5.0,  5.0, 0.0, 5.0, -5.0, 0.0, 5.0, // v7-v4-v3-v2 down
        5.0, 0.0,-5.0, -5.0, 0.0,-5.0, -5.0, 2.0,-5.0,  5.0, 2.0,-5.0  // v4-v7-v6-v5 back
    ]);

    vertices_arm1 = new Float32Array([  // Arm1(3x10x3)
        1.5, 10.0, 1.5, -1.5, 10.0, 1.5, -1.5,  0.0, 1.5,  1.5,  0.0, 1.5, // v0-v1-v2-v3 front
        1.5, 10.0, 1.5,  1.5,  0.0, 1.5,  1.5,  0.0,-1.5,  1.5, 10.0,-1.5, // v0-v3-v4-v5 right
        1.5, 10.0, 1.5,  1.5, 10.0,-1.5, -1.5, 10.0,-1.5, -1.5, 10.0, 1.5, // v0-v5-v6-v1 up
        -1.5, 10.0, 1.5, -1.5, 10.0,-1.5, -1.5,  0.0,-1.5, -1.5,  0.0, 1.5, // v1-v6-v7-v2 left
        -1.5,  0.0,-1.5,  1.5,  0.0,-1.5,  1.5,  0.0, 1.5, -1.5,  0.0, 1.5, // v7-v4-v3-v2 down
        1.5,  0.0,-1.5, -1.5,  0.0,-1.5, -1.5, 10.0,-1.5,  1.5, 10.0,-1.5  // v4-v7-v6-v5 back
    ]);

    vertices_arm2 = new Float32Array([  // Arm2(4x10x4)
        2.0, 10.0, 2.0, -2.0, 10.0, 2.0, -2.0,  0.0, 2.0,  2.0,  0.0, 2.0, // v0-v1-v2-v3 front
        2.0, 10.0, 2.0,  2.0,  0.0, 2.0,  2.0,  0.0,-2.0,  2.0, 10.0,-2.0, // v0-v3-v4-v5 right
        2.0, 10.0, 2.0,  2.0, 10.0,-2.0, -2.0, 10.0,-2.0, -2.0, 10.0, 2.0, // v0-v5-v6-v1 up
        -2.0, 10.0, 2.0, -2.0, 10.0,-2.0, -2.0,  0.0,-2.0, -2.0,  0.0, 2.0, // v1-v6-v7-v2 left
        -2.0,  0.0,-2.0,  2.0,  0.0,-2.0,  2.0,  0.0, 2.0, -2.0,  0.0, 2.0, // v7-v4-v3-v2 down
        2.0,  0.0,-2.0, -2.0,  0.0,-2.0, -2.0, 10.0,-2.0,  2.0, 10.0,-2.0  // v4-v7-v6-v5 back
    ]);

    vertices_palm = new Float32Array([  // Palm(2x2x6)
        1.0, 2.0, 3.0, -1.0, 2.0, 3.0, -1.0, 0.0, 3.0,  1.0, 0.0, 3.0, // v0-v1-v2-v3 front
        1.0, 2.0, 3.0,  1.0, 0.0, 3.0,  1.0, 0.0,-3.0,  1.0, 2.0,-3.0, // v0-v3-v4-v5 right
        1.0, 2.0, 3.0,  1.0, 2.0,-3.0, -1.0, 2.0,-3.0, -1.0, 2.0, 3.0, // v0-v5-v6-v1 up
        -1.0, 2.0, 3.0, -1.0, 2.0,-3.0, -1.0, 0.0,-3.0, -1.0, 0.0, 3.0, // v1-v6-v7-v2 left
        -1.0, 0.0,-3.0,  1.0, 0.0,-3.0,  1.0, 0.0, 3.0, -1.0, 0.0, 3.0, // v7-v4-v3-v2 down
        1.0, 0.0,-3.0, -1.0, 0.0,-3.0, -1.0, 2.0,-3.0,  1.0, 2.0,-3.0  // v4-v7-v6-v5 back
    ]);

    vertices_finger = new Float32Array([  // Fingers(1x2x1)
        0.5, 2.0, 0.5, -0.5, 2.0, 0.5, -0.5, 0.0, 0.5,  0.5, 0.0, 0.5, // v0-v1-v2-v3 front
        0.5, 2.0, 0.5,  0.5, 0.0, 0.5,  0.5, 0.0,-0.5,  0.5, 2.0,-0.5, // v0-v3-v4-v5 right
        0.5, 2.0, 0.5,  0.5, 2.0,-0.5, -0.5, 2.0,-0.5, -0.5, 2.0, 0.5, // v0-v5-v6-v1 up
        -0.5, 2.0, 0.5, -0.5, 2.0,-0.5, -0.5, 0.0,-0.5, -0.5, 0.0, 0.5, // v1-v6-v7-v2 left
        -0.5, 0.0,-0.5,  0.5, 0.0,-0.5,  0.5, 0.0, 0.5, -0.5, 0.0, 0.5, // v7-v4-v3-v2 down
        0.5, 0.0,-0.5, -0.5, 0.0,-0.5, -0.5, 2.0,-0.5,  0.5, 2.0,-0.5  // v4-v7-v6-v5 back
    ]);
   
    var colors = new Float32Array([
        0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, //front
        0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, //right
        1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, //up
        1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, //left
        1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, //btm
        0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, //back
    ]);

   var normals = new Float32Array([ // 法向量
        0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
        1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
        0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
       -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
        0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
        0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
    ]);

    var indices = new Uint8Array([
         0,  1,  2,  0,  2,  3,
         4,  5,  6,  4,  6,  7,
         8,  9, 10,  8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23,
    ]);

    // 将坐标值写入缓冲区对象，但不分配给attribute变量
    g_baseBuffer = initArrayBufferForLaterUse(gl, vertices_base, 3, gl.FLOAT);
    g_arm1Buffer = initArrayBufferForLaterUse(gl, vertices_arm1, 3, gl.FLOAT);
    g_arm2Buffer = initArrayBufferForLaterUse(gl, vertices_arm2, 3, gl.FLOAT);
    g_palmBuffer = initArrayBufferForLaterUse(gl, vertices_palm, 3, gl.FLOAT);
    g_fingerBuffer = initArrayBufferForLaterUse(gl, vertices_finger, 3, gl.FLOAT);

    if(!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color')) { return -1; }
    if(!initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_Normal')) { return -1; }
    if(!initIndiceBuffer(gl, indices)) { return -1; }

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

var ANGLE_STEP = 3.0; // 每次按键转动的角度
var g_arm1Angle = 90.0; // arm1的当前角度
var g_arm2Angle = 45.0; // arm2的当前角度
var g_palmAngle = 0.0; // palm的当前角度
var g_fingerAngle = 0.0; // finger的当前角度

function keydown(env, gl, n, a_Position, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    switch (env.keyCode) {
        case 37: // 按下左键 -> arm1绕y轴负向转动
            g_arm1Angle = (g_arm1Angle - ANGLE_STEP) % 360;
            break;
        case 38: // 按下上键 -> joint1绕z轴正向转动
            if(g_arm2Angle < 135.0){
                g_arm2Angle += ANGLE_STEP;
            }
            break;
        case 39: // 按下右键 -> arm1绕y轴正向转动
            g_arm1Angle = (g_arm1Angle + ANGLE_STEP) % 360;
            break;
        case 40: // 按下下键 -> joint1绕z轴负向转动
            if(g_arm2Angle > -135.0){
                g_arm2Angle -= ANGLE_STEP;
            }
            break;
        case 65: // a
            g_palmAngle = (g_palmAngle - ANGLE_STEP) % 360;
            break;
        case 68: // d
        g_palmAngle = (g_palmAngle + ANGLE_STEP) % 360;
            break;
        case 83: // s
            if(g_fingerAngle > -60.0){
                g_fingerAngle -= ANGLE_STEP;
            }
            break;
        case 87: // w
            if(g_fingerAngle < 60.0){
                g_fingerAngle += ANGLE_STEP;
            }
            break;
        default:
            return;
    }
    // 绘制机器人手臂
    draw(gl, n, a_Position, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

// 坐标变换矩阵
var g_modelMatrix = new Matrix4(), g_mvpMatrix = new Matrix4();

function draw(gl, n, a_Position, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    // 清空颜色和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 绘制base
    var baseHeight = 2.0;
    g_modelMatrix.setTranslate(0.0, -12.0, 0.0);
    drawSegment(gl, n, g_baseBuffer, a_Position, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
    // arm1
    var arm1Length = 10.0;
    g_modelMatrix.translate(0.0, baseHeight, 0.0); // 移至基座
    g_modelMatrix.rotate(g_arm1Angle, 0.0, 1.0, 0.0); // 旋转
    drawSegment(gl, n, g_arm1Buffer, a_Position, viewProjMatrix, u_MvpMatrix, u_NormalMatrix); // 绘制
    // arm2
    var arm2Length = 10.0;
    g_modelMatrix.translate(0.0, arm1Length, 0.0); // 移至joint1处
    g_modelMatrix.rotate(g_arm2Angle, 0.0, 0.0, 1.0); // 绕z轴旋转
    g_modelMatrix.scale(1.3, 1.0, 1.3); // 使立方体粗一点
    drawSegment(gl, n, g_arm2Buffer, a_Position, viewProjMatrix, u_MvpMatrix, u_NormalMatrix); // 绘制
    // palm
    var palmLength = 2.0;
    // 移至palm一端的中点
    g_modelMatrix.translate(0.0, arm2Length, 0.0);
    g_modelMatrix.rotate(g_palmAngle, 0.0, 1.0, 0.0);
    drawSegment(gl, n, g_palmBuffer, a_Position, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
    // 绘制finger
    g_modelMatrix.translate(0.0, palmLength, 0.0);
    // 绘制finger1
    var tempMatrix = new Matrix4(g_modelMatrix);
    pushMatrix(g_modelMatrix);
    g_modelMatrix.translate(0.0, 0.0, 2.0);
    g_modelMatrix.rotate(g_fingerAngle, 1.0, 0.0, 0.0); // 旋转
    drawSegment(gl, n, g_fingerBuffer, a_Position, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
    // 绘制finger2
    g_modelMatrix = tempMatrix;
    g_modelMatrix.translate(0.0, 0.0, -2.0);
    g_modelMatrix.rotate(-g_fingerAngle, 1.0, 0.0, 0.0); // 旋转
    drawSegment(gl, n, g_fingerBuffer, a_Position, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

var g_normalMatrix = new Matrix4(); // 法线的旋转矩阵

// 绘制部件
function drawSegment(gl, n, buffer, a_Position, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 将缓冲区对象分配给attribute变量
    gl.vertexAttribPointer(a_Position, buffer.num, buffer.type, false, 0, 0);
    // 开启变量
    gl.enableVertexAttribArray(a_Position);

    // 计算模型视图矩阵并传给u_MvpMatrix变量
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
    // 计算法线变换矩阵并传给u_NormalMatrix变量
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
    // 绘制
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
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

function initIndiceBuffer(gl, indices) {
    var indicesBuffer = gl.createBuffer();
    if(!indicesBuffer) {
        console.log('Failed to create indicesBuffer');
        return false;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return true;
}