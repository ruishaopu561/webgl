// HelloCube.js
// 顶点着色器程序
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal; // 法向量
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_ModelMatrix; // 模型矩阵
    uniform mat4 u_NormalMatrix; // 用来变换法向量的矩阵
    varying vec4 v_Color;
    varying vec3 v_Normal;
    varying vec3 v_Position;
    
    void main() {
        gl_Position = u_MvpMatrix * a_Position;
        // 计算顶点的世界坐标
        v_Position = vec3(u_ModelMatrix * a_Position);
        v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
        v_Color = a_Color;
    }
`;

// 片元着色器程序
var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec3 u_LightColor;
    uniform vec3 u_LightPosition;
    uniform vec3 u_AmbientLight;
    varying vec3 v_Normal;
    varying vec3 v_Position;
    varying vec4 v_Color;
    
    void main() {
        // 对法线进行归一化，因为其内插之后长度不一定是1.0
        vec3 normal = normalize(v_Normal);
        // 计算光线方向并归一化
        vec3 lightDirection = normalize(u_LightPosition - v_Position);
        // 计算光线方向和法向量的点积
        float nDotL = max(dot(lightDirection, normal), 0.0);
        // 计算diffuse、ambient以及最终的颜色
        vec3 diffuse = u_LightColor * v_Color.rgb * nDotL;
        vec3 ambient = u_AmbientLight * v_Color.rgb;
        gl_FragColor = vec4(diffuse + ambient, v_Color.a);
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
    if(n < 0) {
        console.log('Failed to initialize enough points');
        return;
    }

    initLight(gl);

    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');

    var modelMatrix = new Matrix4(); // 模型矩阵
    var normalMatrix = new Matrix4();
    var mvpMatrix = new Matrix4();

    modelMatrix.rotate(90, 0, 0, 1); // 绕z轴旋转
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // 获取u_ViewMatrix变量的存储地址
    mvpMatrix.setPerspective(30, 1, 1, 100);
    mvpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);
    // 将模型视图投影矩阵传给u_MvpMatrix变量
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // 绘制立方体
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function initLight(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 开启隐藏面消除
    gl.enable(gl.DEPTH_TEST);
    // 清空颜色和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 设置光线颜色（白色）
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

    // 设置光线方向(世界坐标系下的)
    var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    var lightDirection = new Vector3([0.5, 3.0, 4.0]);
    lightDirection.normalize(); // 归一化
    gl.uniform3fv(u_LightDirection, lightDirection.elements);

    var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    gl.uniform3f(u_LightPosition, 0.0, 3.0, 4.0);
}

function initVertexBuffers(gl) {
    var vertices = new Float32Array([ // 顶点坐标
        1.0,  1.0,  1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0,  1.0, -1.0,  1.0, //front面 v0-4
        1.0,  1.0,  1.0,  1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0,  1.0, -1.0, //right v0345
        1.0,  1.0,  1.0,  1.0,  1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,  1.0, //up v0561
       -1.0,  1.0,  1.0, -1.0, -1.0,  1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0, //left 
       -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0, -1.0, -1.0, -1.0, -1.0, -1.0, //down
        1.0, -1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0, -1.0, -1.0, -1.0, -1.0 //back
   ]);

    var colors = new Float32Array([
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, //front
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, //right
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, //up
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, //left
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, //btm
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0 //back
    ]);

   var normals = new Float32Array([ // 法向量
         0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,
         1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0, 
         0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0, 
        -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, 
         0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0, 
         0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,
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