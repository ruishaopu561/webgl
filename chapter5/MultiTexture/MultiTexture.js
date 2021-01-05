// TextureQuad.js
// 顶点着色器程序
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec2 a_TexCoord;\n' +
    'varying vec2 v_TexCoord;\n' + // 类型和命名都相同的varying变量会自动传入片元着色器
    'void main() {\n' +
    'gl_Position = a_Position;\n' + // 位置坐标
    'v_TexCoord = a_TexCoord;\n' + // 设置尺寸
    '}\n';

// 片元着色器程序
var FSHADER_SOURCE = 
    'precision mediump float;\n' +
    'uniform sampler2D u_Sampler0;\n' +
    'uniform sampler2D u_Sampler1;\n' +
    'varying vec2 v_TexCoord;\n' + 
    'void main() {\n' +
    '  vec4 color0 = texture2D(u_Sampler0, v_TexCoord);\n' +
    '  vec4 color1 = texture2D(u_Sampler1, v_TexCoord);\n' +
    '  gl_FragColor = color0 * color1;\n' +
    '}\n';

function main() {
    var canvas = document.getElementById('webgl');

    var gl = getWebGLContext(canvas); // 使用webgl的上下文
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    gl_PointSize = 10.0;
    // 在WebGL系统内建立和初始化着色器
    if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var n = initVertexBuffers(gl);
    if(n < 0){
        console.log('Failed to get enough points');
        return;
    }

    if(!initTextures(gl, n)){
        console.log('Failed to get textures');
        return;
    }
}

function initVertexBuffers(gl) {
    var verticesTexCoords = new Float32Array([
        // 顶点坐标，纹理坐标
        -0.5,  0.5, 0.0, 1.0,
        -0.5, -0.5, 0.0, 0.0,
         0.5,  0.5, 1.0, 1.0,
         0.5, -0.5, 1.0, 0.0,
    ]);
    var n = 4; // 顶点数目

    // 创建缓冲区对象
    var vertexTexCoordBuffer = gl.createBuffer();

    // 将顶点坐标和纹理坐标写入缓冲区对象并开启
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

    var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
    gl.enableVertexAttribArray(a_TexCoord); // 开启a_TexCoord

    return n;
}

function initTextures(gl, n) {
    // 创建缓冲区对象
    var texture0 = gl.createTexture();
    var texture1 = gl.createTexture();
    
    // 获取u_Sampler的存储位置
    var u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    var u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');

    // 创建Image对象
    var image0 = new Image();
    var image1 = new Image();
    if(!image0 || !image1){
        console.log('Failed to create image');
        return;
    }

    // 注册对象加载事件的响应函数
    image0.onload = function(){ loadTexture(gl, n, texture0, u_Sampler0, image0, 0); };
    image1.onload = function(){ loadTexture(gl, n, texture1, u_Sampler1, image1, 1); };

    image0.src = 'http://localhost:8000/TexturedQuad/resources/sky.jpg';
    image1.src = 'http://localhost:8000/TexturedQuad/resources/circle.gif';

    return true;
}

var g_texUnit0 = false, g_texUnit1 = false;
function loadTexture(gl, n, texture, u_Sampler, image, texUnit) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); //对纹理图像进行y轴反转
    // 激活纹理
    if(texUnit == 0) {
        gl.activeTexture(gl.TEXTURE0);
        g_texUnit0 = true;
    } else {
        gl.activeTexture(gl.TEXTURE1);
        g_texUnit1 = true;
    }
    
    // 绑定纹理对象到目标上
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 配置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // 配置纹理图像
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // 将纹理单元编号传递给取样器
    gl.uniform1i(u_Sampler, texUnit);

    // 两次load是异步进行，因此无法确定完成顺序，必须都纳入判断
    if(g_texUnit0 && g_texUnit1) {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // 绘制矩形
    }
}