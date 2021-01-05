// LookAtTriangles.js
// 顶点着色器程序
var VSHADER_SOURCE = 
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'uniform mat4 u_ViewMatrix;\n' +
    'uniform mat4 u_ProjMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
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
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');

    // 设置视点、视线和上方向
    var modelMatrix = new Matrix4(); // 模型矩阵
    var viewMatrix = new Matrix4(); // 视图矩阵
    var projMatrix = new Matrix4(); // 投影矩阵

    // 计算视图矩阵和投影矩阵
    modelMatrix.setTranslate(0.75, 0, 0); // 平移0.75单位
    viewMatrix.setLookAt(0, 0, 5, 0, 0, -100, 0, 1, 0);
    projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);;

    // 将模型矩阵、视图矩阵和投影矩阵传给相应的uniform变量
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 开启隐藏面消除
    gl.enable(gl.DEPTH_TEST | gl.POLYGON_OFFSET_FILL);
    // 清空颜色和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.polygonOffset(1.0, 1.0);

    // 绘制三角形
    gl.drawArrays(gl.TRIANGLES, 0, n); // 绘制右侧的一组三角形

    // 为另一侧的三角形重新计算模型矩阵
    modelMatrix.setTranslate(-0.75, 0, 0); // 平移-0.75单位
    // 只修改了模型矩阵
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    gl.drawArrays(gl.TRIANGLES, 0, n); // 绘制左侧的一组三角形
}

function initVertexBuffers(gl) {
    var verticesColors = new Float32Array([
        // 右侧的3个三角形
         0.75,  1.0,  0.0, 0.4, 0.4, 1.0, // 蓝色三角形在最前面
         0.25, -1.0,  0.0, 0.4, 0.4, 1.0, 
         1.25, -1.0,  0.0, 1.0, 0.4, 0.4,

         0.75,  1.0, -2.0, 1.0, 0.4, 0.4, // 黄色三角形在中间
         0.25, -1.0, -2.0, 1.0, 1.0, 0.4, 
         1.25, -1.0, -2.0, 1.0, 1.0, 0.4,

         0.75,  1.0, -4.0, 0.4, 1.0, 0.4, // 绿色三角形在最后面
         0.25, -1.0, -4.0, 0.4, 1.0, 0.4, 
         1.25, -1.0, -4.0, 1.0, 0.4, 0.4,

        // 左侧的3个三角形
        -0.75,  1.0,  0.0, 0.4, 0.4, 1.0, // 蓝色三角形在最前面
        -0.25, -1.0,  0.0, 0.4, 0.4, 1.0, 
        -1.25, -1.0,  0.0, 1.0, 0.4, 0.4,
        
        -0.75,  1.0, -2.0, 1.0, 0.4, 0.4, // 黄色三角形在中间
        -0.25, -1.0, -2.0, 1.0, 1.0, 0.4, 
        -1.25, -1.0, -2.0, 1.0, 1.0, 0.4,

        -0.75,  1.0, -4.0, 0.4, 1.0, 0.4, // 绿色三角形在最后面
        -0.25, -1.0, -4.0, 0.4, 1.0, 0.4, 
        -1.25, -1.0, -4.0, 1.0, 0.4, 0.4,
    ]);
    var n = 18; // 每个三角形3个顶点，共6个三角形

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