// DrawRectangle.js
function main(){
    // 获取<canvas>元素
    var canvas = document.getElementById('example');
    if(!canvas){
        console.log('Failed to retrive the <canvas> element');
        return;
    }

    // 获取绘制二位图形的绘图上下文，参数是上下文类型，二维或三维
    var ctx = canvas.getContext('2d');

    // 绘制蓝色矩形
    ctx.fillStyle = 'rgba(255, 0, 0, 1.0)'; // 设置填充颜色
    ctx.fillRect(120, 10, 150, 150); // 使用填充颜色填充矩形
}