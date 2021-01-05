// HelloCube.js
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

    // 注册键盘事件响应函数
    document.onkeydown = function(env) {
        keydown(env, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
    }

    draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

function initVertexBuffers(gl) {
    var vertices = new Float32Array([ // 顶点坐标
         1.5, 10.0, 1.5, -1.5, 10.0, 1.5, -1.5,  0.0, 1.5,  1.5,  0.0, 1.5, // v0-v1-v2-v3 front
         1.5, 10.0, 1.5,  1.5,  0.0, 1.5,  1.5,  0.0,-1.5,  1.5, 10.0,-1.5, // v0-v3-v4-v5 right
         1.5, 10.0, 1.5,  1.5, 10.0,-1.5, -1.5, 10.0,-1.5, -1.5, 10.0, 1.5, // v0-v5-v6-v1 up
        -1.5, 10.0, 1.5, -1.5, 10.0,-1.5, -1.5,  0.0,-1.5, -1.5,  0.0, 1.5, // v1-v6-v7-v2 left
        -1.5,  0.0,-1.5,  1.5,  0.0,-1.5,  1.5,  0.0, 1.5, -1.5,  0.0, 1.5, // v7-v4-v3-v2 down
         1.5,  0.0,-1.5, -1.5,  0.0,-1.5, -1.5, 10.0,-1.5,  1.5, 10.0,-1.5, // v4-v7-v6-v5 back
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
         0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
         1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
         0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0, // v1-v6-v7-v2 left
         0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0, // v7-v4-v3-v2 down
         0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0, // v4-v7-v6-v5 back
    ]);

    var indices = new Uint8Array([
         0,  1,  2,  0,  2,  3,
         4,  5,  6,  4,  6,  7,
         8,  9, 10,  8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23,
    ]);

    if(!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')) { return -1; }
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

var ANGLE_STEP = 3.0; // 每次按键转动的角度
var g_arm1Angle = 90.0; // arm1的当前角度
var g_joint1Angle = 0.0; // joint1的当前角度(即arm2的角度)

function keydown(env, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    switch (env.keyCode) {
        case 37: // 按下左键 -> arm1绕y轴负向转动
            g_arm1Angle = (g_arm1Angle - ANGLE_STEP) % 360;
            break;
        case 38: // 按下上键 -> joint1绕z轴正向转动
            if(g_joint1Angle < 135.0){
                g_joint1Angle += ANGLE_STEP;
            }
            break;
        case 39: // 按下右键 -> arm1绕y轴正向转动
            g_arm1Angle = (g_arm1Angle + ANGLE_STEP) % 360;
            break;
        case 40: // 按下下键 -> joint1绕z轴负向转动
            if(g_joint1Angle > -135.0){
                g_joint1Angle -= ANGLE_STEP;
            }
            break;
        default:
            return;
    }

    draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

// 坐标变换矩阵
var g_modelMatrix = new Matrix4(), g_mvpMatrix = new Matrix4();

function draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 开启隐藏面消除
    gl.enable(gl.DEPTH_TEST);
    // 清空颜色和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Arm1
    var arm1Length = 10.0; // arm1的长度
    g_modelMatrix.setTranslate(0.0, -12.0, 0.0);
    g_modelMatrix.rotate(g_arm1Angle, 0.0, 1.0, 0.0); // 绕y轴旋转
    drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

    // Arm2
    g_modelMatrix.translate(0.0, arm1Length, 0.0); // 移至joint1处
    g_modelMatrix.rotate(g_joint1Angle, 0.0, 0.0, 1.0); // 绕z轴旋转
    g_modelMatrix.scale(1.3, 1.0, 1.3); // 使立方体粗一点
    drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix); // 绘制
}

var g_normalMatrix = new Matrix4(); // 法线的旋转矩阵

// 绘制立方体
function drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
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