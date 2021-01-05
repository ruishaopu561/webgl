// TextureQuad.js
// 顶点着色器程序
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec2 a_TexCoord;\n' +
    'varying vec2 v_TexCoord;\n' + // 类型和命名都相同的varying变量会自动传入片元着色器
    'void main() {\n' +
    '    gl_Position = a_Position;\n' + // 位置坐标
    '    v_TexCoord = a_TexCoord;\n' + // 设置尺寸
    '}\n';

// 片元着色器程序
var FSHADER_SOURCE = 
    'precision mediump float;\n' +
    'uniform sampler2D u_Sampler;\n' +
    'varying vec2 v_TexCoord;\n' + 
    'void main() {\n' +
    '    gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' + // 从顶点着色器接受数据
    '}\n';

function main() {
    var canvas = document.getElementById('webgl');

    var gl = getWebGLContext(canvas); // 使用webgl的上下文
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

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

    if(!initTextures(gl, n)) {
        console.log('Failed to get textures');
        return;
    }
}

function initVertexBuffers(gl) {
    // var verticesTexCoords = new Float32Array([
    //     // 顶点坐标，纹理坐标
    //     -0.5,  0.5, 0.0, 1.0,
    //     -0.5, -0.5, 0.0, 0.0,
    //      0.5,  0.5, 1.0, 1.0,
    //      0.5, -0.5, 1.0, 0.0,
    // ]);
    var verticesTexCoords = new Float32Array([
        // 顶点坐标，纹理坐标
        -0.5,  0.5, -0.3,  1.7,
        -0.5, -0.5, -0.3, -0.2,
         0.5,  0.5,  1.7,  1.7,
         0.5, -0.5,  1.7, -0.2,
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
    var texture = gl.createTexture(); // 创建一个纹理对象
    
    // 获取u_Sampler的存储位置
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');

    var image = new Image(); // 创建一个image对象
    if(!image){
        console.log('Failed to create image');
        return;
    }

    // 注册对象加载事件的响应函数
    image.onload = function(){ loadTexture(gl, n, texture, u_Sampler, image); };

    // 浏览器开始加载图像，为了解决chrome访问本地文件，先python3 -m http.server
    // 然后image.src要设置为http://localhost:8000/*，这样才可以正常访问
    image.src = 'http://localhost:8000/TexturedQuad/resources/sky.jpg';
    console.log(image.src);

    return true;
}

function loadTexture(gl, n, texture, u_Sampler, image) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); //对纹理图像进行y轴反转
    // 开启0号纹理单元
    gl.activeTexture(gl.TEXTURE0);
    // 向target绑定纹理对象
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 配置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    // 配置纹理图像
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // 将0号纹理传递给着色器
    gl.uniform1i(u_Sampler, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // 绘制矩形
}