// ColoredPoints.js
// 顶点着色器程序
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute float a_PointSize;\n' + 
    'void main() {\n' +
    'gl_Position = a_Position;\n' + // 位置坐标
    'gl_PointSize = a_PointSize;;\n' + // 设置尺寸
    '}\n';

// 片元着色器程序
var FSHADER_SOURCE = 
    'precision mediump float;\n' +  // 精度限定词，指定变量的范围和精度
    'uniform vec4 u_FragColor;\n' +
    'void main() {\n' +
    'gl_FragColor = u_FragColor;\n' + // 设置颜色
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

    // 获取a_Position变量的存储位置
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0){
        console.log('Failed to get the location of a_Position');
        return;
    }

    // 获取a_PointSize变量的存储位置
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    gl.vertexAttrib1f(a_PointSize, 10.0);

    // 获取u_FragColor变量的存储位置
    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    canvas.onmousedown = function(ev) { click(ev, gl, canvas, a_Position, u_FragColor); };

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

var g_points = []; // 全局变量，存储点坐标的数组
var g_colors = []; // 存储点颜色的数组

function click(ev, gl, canvas, a_Position, u_FragColor) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    x = ((x - rect.left) - canvas.height/2)/(canvas.height/2);
    y = (canvas.width/2 - (y - rect.top))/ (canvas.width/2);

    g_points.push([x, y]);

    // 将点的颜色存储到g_colors数组中
    if(x >= 0.0 && y >= 0.0){
        g_colors.push([1.0, 0.0, 0.0, 1.0]);
    } else if(x < 0.0 && y < 0.0){
        g_colors.push([0.0, 1.0, 0.0, 1.0]);
    } else {
        g_colors.push([1.0, 1.0, 1.0, 1.0]);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = g_points.length;
    for(var i=0; i<len; i++) {
        var xy = g_points[i];
        var rgba = g_colors[i];

        // 将顶点位置传输给attribute变量
        gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        // 将点的颜色传输到u_FragColor变量中
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // 绘制点
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}