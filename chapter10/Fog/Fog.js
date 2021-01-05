// PickObject.js
// 顶点着色器程序
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_ModelMatrix;
    uniform vec4 u_Eye; // 视点，世界坐标系
    varying vec4 v_Color;
    varying float v_Dist;
    void main() {
        gl_Position = u_MvpMatrix * a_Position;
        v_Color = a_Color;
        v_Dist = gl_Position.w;
        // v_Dist = distance(u_ModelMatrix * a_Position, u_Eye);
    }
`;

// 片元着色器程序
var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec3 u_FogColor; // 雾的颜色
    uniform vec2 u_FogDist; // 雾的起点和终点
    varying vec4 v_Color;
    varying float v_Dist;
    void main() {
        float fogFactor = clamp((u_FogDist.y - v_Dist) / (u_FogDist.y, u_FogDist.x), 0.0, 1.0);
        // u_FogColor * (1 - fogFactor) + v_Color * fogFactor
        vec3 color = mix(u_FogColor, vec3(v_Color), fogFactor);
        gl_FragColor = vec4(color, v_Color.a);
    }
`;

function main() {
    var canvas = document.getElementById('webgl');

    // 获取WebGL绘图上下文
    var gl = getWebGLContext(canvas);
    if(!gl) {
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
    
    var u_FogColor = gl.getUniformLocation(gl.program, 'u_FogColor');
    var u_FogDist = gl.getUniformLocation(gl.program, 'u_FogDist');
    var u_Eye = gl.getUniformLocation(gl.program, 'u_Eye');

    // 雾的颜色
    var fogColor = new Float32Array([0.537, 0.631, 0.823]);
    // 雾化的起点和终点与视点间的距离[起点距离，终点距离]
    var FogDist = new Float32Array([55, 80]);
    // 视点在世界坐标系下的坐标
    var eye = new Float32Array([25, 65, 35, 1.0]);

    // 将雾的颜色、起点与终点、视点坐标传给对应的uniform变量
    gl.uniform3fv(u_FogColor, fogColor); // 雾的颜色
    gl.uniform2fv(u_FogDist, FogDist); // 起点和终点
    gl.uniform4fv(u_Eye, eye); // 视点

    // 设置背景色
    gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1.0);
    // 开启隐藏面消除
    gl.enable(gl.DEPTH_TEST);

    var modelMatrix = new Matrix4();
    var mvpMatrix = new Matrix4();

    modelMatrix.setTranslate(0.5, 0.0, 0.0);
    mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    mvpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);

    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
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