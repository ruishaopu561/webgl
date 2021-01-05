// Shadow.js
// 生成阴影贴图的顶点缓冲区
var SHADOW_VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform mat4 u_MvpMatrix;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
    }`;

// 生成阴影贴图的片元缓冲区
var SHADOW_FSHADER_SOURCE = `
    #ifdef GL_ES
    precision mediump float;
    #endif
    void main() {
        gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);
    }`;


// 顶点着色器程序
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_MvpMatrixFromLight;
    varying vec4 v_PositionFromLight;
    varying vec4 v_Color;
    void main() {
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionFromLight = u_MvpMatrixFromLight * a_Position;
        v_Color = a_Color;
    }`;

// 片元着色器程序
var FSHADER_SOURCE = `
    #ifdef GL_ES
    precision mediump float;
    #endif
    uniform sampler2D u_ShadowMap;            // 取样器
    varying vec4 v_PositionFromLight;         // 光源的位置
    varying vec4 v_Color;
    void main() {
        vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/ 2.0 + 0.5;
        vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);
        float depth = rgbaDepth.r;                            // 从R分量中获取Z值
        // 8位的浮点数的精度为1/256，就是0.00390625，让偏移量略大于马赫带，就可以避免出现马赫带
        float visibility = (shadowCoord.z > depth + 0.005) ? 0.7 : 1.0; // 如果为0.7就表示在阴影中，这里加上了0.005的偏移量，会消除出现马赫带
        gl_FragColor = vec4(v_Color.rgb * visibility, v_Color.a);
    }`;

var OFFSCREEN_WIDTH = 2048, OFFSCREEN_HEIGHT = 2048;
//在这里如果直接增大光源Y的值，就会出现阴影消失的现象
var LIGHT_X = 0, LIGHT_Y = 30, LIGHT_Z = 2; // 光源位置

function main() {
    var canvas = document.getElementById('webgl');

    // 获取WebGL绘图上下文
    var gl = getWebGLContext(canvas);
    if(!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // 初始化以生成阴影贴图的着色器
    var shadowProgram = createProgram(gl, SHADOW_VSHADER_SOURCE, SHADOW_FSHADER_SOURCE);
    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
    shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');
    if(shadowProgram.a_Position < 0 || !shadowProgram.u_MvpMatrix) {
        console.log('Failed to get the storage location of attribute or uniform variable from shadowProgram');
        return;
    }

    // 初始化正常绘制的着色器
    var normalProgram = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    normalProgram.a_Position = gl.getAttribLocation(normalProgram, 'a_Position');
    normalProgram.a_Color = gl.getAttribLocation(normalProgram, 'a_Color');
    normalProgram.u_MvpMatrix = gl.getUniformLocation(normalProgram, 'u_MvpMatrix');
    normalProgram.u_MvpMatrixFromLight = gl.getUniformLocation(normalProgram, 'u_MvpMatrixFromLight');
    normalProgram.u_ShadowMap = gl.getUniformLocation(normalProgram, 'u_ShadowMap');
    if (normalProgram.a_Position < 0 || normalProgram.a_Color < 0 || !normalProgram.u_MvpMatrix ||
        !normalProgram.u_MvpMatrixFromLight || !normalProgram.u_ShadowMap) {
        console.log('Failed to get the storage location of attribute or uniform variable from normalProgram');
        return;
    }

    // 初始化三角形和矩形的顶点缓冲区信息
    var triangle = initVertexBuffersForTriangle(gl);
    var plane = initVertexBuffersForPlane(gl);
    if (!triangle || !plane) {
        console.log('Failed to set the vertex information');
        return;
    }

    // 初始化帧缓冲区(FBO)
    var fbo = initFramebufferObject(gl);
    if(!fbo) {
        console.log('Failed to initialize frame buffer object');
        return;
    }
    gl.activeTexture(gl.TEXTURE0); // 将纹理对象绑定到纹理单元上
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // 设置模型视图投影矩阵
    var viewProjMatrixFromLight = new Matrix4(); // 为阴影贴图准备
    viewProjMatrixFromLight.setPerspective(70.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 100.0);
    viewProjMatrixFromLight.lookAt(LIGHT_X, LIGHT_Y, LIGHT_Z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    var viewProjMatrix = new Matrix4(); // 为正常绘制准备
    viewProjMatrix.setPerspective(45, canvas.width/canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(0.0, 7.0, 9.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    var currentAngle = 0.0; // 当前旋转角度
    var mvpMatrixFromLight_t = new Matrix4(); // 三角形
    var mvpMatrixFromLight_p = new Matrix4(); // 矩形平面
    var tick = function() {
        currentAngle = animate(currentAngle);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);                  //将绘制目标切换为帧缓冲区
        gl.viewport(0.0, 0.0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(shadowProgram); // 准备生成纹理贴图
        // 进行纹理绘制操作以生成纹理贴图
        drawTriangle(gl, shadowProgram, triangle, currentAngle, viewProjMatrixFromLight);
        mvpMatrixFromLight_t.set(g_mvpMatrix);
        drawPlane(gl, shadowProgram, plane, viewProjMatrixFromLight);
        mvpMatrixFromLight_p.set(g_mvpMatrix);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); // 将绘制目标切换为颜色缓冲区
        gl.viewport(0.0, 0.0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(normalProgram); // 准备正常绘制
        gl.uniform1i(normalProgram.u_ShadowMap, 0); // 传递gl.TEXTURE0
        // 进行正常的绘制操作，绘出三角形和矩形平面
        gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.elements);
        drawTriangle(gl, normalProgram, triangle, currentAngle, viewProjMatrix);
        gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
        drawPlane(gl, normalProgram, plane, viewProjMatrix);

        window.requestAnimationFrame(tick, canvas);
    };
    tick();
}

var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();
function drawTriangle(gl, progarm, trianle, angle, viewProjMatrix) {
    g_modelMatrix.setRotate(angle, 0.0, 1.0, 0.0);
    draw(gl, progarm, trianle, viewProjMatrix);
}

function drawPlane(gl, program, plane, viewProjMatrix) {
    g_modelMatrix.setRotate(-45.0, 0.0, 1.0, 1.0);
    draw(gl, program, plane, viewProjMatrix);
}

function draw(gl, progarm, o, viewProjMatrix) {
    initAttributeVariable(gl, progarm.a_Position, o.vertexBuffer);
    if (progarm.a_Color != undefined){
        initAttributeVariable(gl, progarm.a_Color, o.colorBuffer);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(progarm.u_MvpMatrix, false, g_mvpMatrix.elements);

    gl.drawElements(gl.TRIANGLES, o.numIndices, gl.UNSIGNED_BYTE, 0);
}

function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

function initVertexBuffersForPlane(gl) {
    // Create a plane
    //  v1------v0
    //  |        |
    //  |        |
    //  |        |
    //  v2------v3

    var vertices = new Float32Array([
        3.0,-1.7,2.5, -3.0,-1.7,2.5, -3.0,-1.7,-2.5, 3.0,-1.7,-2.5 // v0-v1-v2-v3
    ]);

    var colors = new Float32Array([
        1.0,1.0,1.0, 1.0,1.0,1.0, 1.0,1.0,1.0, 1.0,1.0,1.0
    ]);

    var indices = new Uint8Array([0, 1, 2, 0, 2, 3]);

    var o = new Object();
    o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
    o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
    if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null;

    o.numIndices = indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

function initVertexBuffersForTriangle(gl) {
    // Create a triangle
    //       v2
    //      / |
    //     /  |
    //    /   |
    //  v0----v1

    var vertices = new Float32Array([-0.8, 3.5, 0.0,  0.8, 3.5, 0.0,  0.0, 3.5, 1.8]);
    var colors = new Float32Array([1.0, 0.5, 0.0,  1.0, 0.5, 0.0,  1.0, 0.0, 0.0]);
    var indices = new Uint8Array([0, 1, 2]);
    
    var o = new Object();

    o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
    o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
    if(!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null;

    o.numIndices = indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

function initArrayBufferForLaterUse(gl, data, num, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // Store the necessary information to assign the object to the attribute variable later
    buffer.num = num;
    buffer.type = type;

    return buffer;
}

function initElementArrayBufferForLaterUse(gl, data, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    buffer.type = type;

    return buffer;
}

function initFramebufferObject(gl) {
    var framebuffer, texture, depthBuffer;

    var error = function() {
        if (framebuffer) gl.deleteFramebuffer(framebuffer);
        if (texture) gl.deleteTexture(texture);
        if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
        return null;
    }

    // 创建帧缓冲区(FBO)
    framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
        console.log('Failed to create frame buffer object');
        return error();
    }

    // 创建纹理对象并设置其尺寸和参数
    texture = gl.createTexture(); // 创建纹理对象
    if (!texture) {
        console.log('Failed to create texture object');
        return error();
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // 创建渲染缓冲区对象并设置其尺寸和参数
    depthBuffer = gl.createRenderbuffer(); // 创建渲染缓冲区
    if (!depthBuffer) {
        console.log('Failed to create renderbuffer object');
        return error();
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

    // 将纹理和渲染缓冲区对象关联到帧缓冲区对象上
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    // 检查缓冲区是否被正确设置
    var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if(e != gl.FRAMEBUFFER_COMPLETE) {
        console.log('Framebuffer object is incomplete: ' + e.toString());
        return error();
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    framebuffer.texture = texture; // 保存纹理对象

    return framebuffer;
}

var ANGLE_STEP = 40;   // The increments of rotation angle (degrees)
var last = Date.now(); // Last time that this function was called
function animate(angle) {
    var now = Date.now();   // Calculate the elapsed time
    var elapsed = now - last;
    last = now;
    // Update the current rotation angle (adjusted by the elapsed time)
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle % 360;
}