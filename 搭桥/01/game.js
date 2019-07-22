let game;
// 设置游戏中一些属性
let gameOptions = {
    platformGapRange: [200, 400],// 两个台子之间的距离（范围）
    platformWidthRange: [50, 150], // 生成台子的宽度（范围）
    platformHeight: 600, // 第一个场地的高度
    playerWidth: 32,// 人物的宽度
    playerHeight: 64,// 人物的高度
    poleWidth: 8, // 人物距离台子又边缘的距离
    growTime: 500,
    rotateTime: 500, // 补间动画时长(桥转动)
    walkTime: 500, // 补间动画时长（小人走路）
    fallTime: 500, // 补间动画时长（小人掉落）
    scrollTime: 250 // 补间动画的时长（台子移动）
}
let scoreText = 0; // 游戏分数文字
let score = 0;// 分数
// 动画的状态
const IDLE = 0; // 执行状态（小人走路）
const WAITING = 1;// 等待状态（啥都不做）
const GROWING = 2;// 操作状态（定位桥的长度）
window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO, // 自动选择渲染器
        width: 750, // 宽度
        height: 1334,// 高度
        scene: [playGame],// 生命周期，封装成了一个CLASS
        backgroundColor: 0x0c88c7 // 背景颜色
    }
    game = new Phaser.Game(gameConfig); // 创建游戏
    window.focus();// 把键盘焦点给予一个窗口。
    resize();// 根据浏览器窗口大小改变大小
    window.addEventListener("resize", resize, false); // 监听浏览器窗口大小
}
// 游戏的类继承游戏的场景类
class playGame extends Phaser.Scene{
    constructor(){
        // 后面重新开始游戏需要调这个名字
        super("PlayGame1");
    }
    // 预加载，加载游戏图片
    preload(){
        this.load.image("tile", "tile.png");
    }
    // 游戏开始啦
    create(){
        // 添加游戏场景
        this.addPlatforms();
        // 添加人物
        this.addPlayer();
        // 添加桥
        this.addPole();
        // 游戏监听鼠标按下
        this.input.on("pointerdown", this.grow, this);
        // 游戏监听鼠标离开
        this.input.on("pointerup", this.stop, this);
        // 添加分数（位置16.16，初始显示，样式）
        scoreText = this.add.text(16, 16, 'Score:'+score, { fontSize: '32px', fill: '#000' });
    }
    addPlatforms(){
        // 小人所在的台子初始为0
        this.mainPlatform = 0;
        // 定义台子数组
        this.platforms = [];
        // 添加初始位置的台子，距左面是0的位置
        this.platforms.push(this.addPlatform(0));
        // 添加第二个台子(在画布最右面，页面看不到)
        this.platforms.push(this.addPlatform(game.config.width));
        // 通过补间动画把第二个台子移到画布中来
        this.tweenPlatform();
    }
    // 初始化台子（根据posX初始化第几个台子）
    addPlatform(posX){
        // 确定台子的位置
        let platform = this.add.sprite(posX, game.config.height - gameOptions.platformHeight, "tile");
        // 确定台子的宽度
        platform.displayWidth = (gameOptions.platformWidthRange[0] + gameOptions.platformWidthRange[1]) / 2;
        // 确定台子的高度
        platform.displayHeight = gameOptions.platformHeight;
        // 设置透明度
        platform.alpha = 0.7;
        // 台子的源点（刚才的定位都是定位源点）
        platform.setOrigin(0, 0);
        return platform
    }
    // 补间动画
    tweenPlatform(){
        // 距离屏幕左侧的距离为第一个台子的宽度加上中间空白的宽度（在200和400之间随机数）
        let destination = this.platforms[this.mainPlatform].displayWidth + Phaser.Math.Between(gameOptions.platformGapRange[0], gameOptions.platformGapRange[1]);
        let size = Phaser.Math.Between(gameOptions.platformWidthRange[0], gameOptions.platformWidthRange[1]);
        // 补间动画
        // 补间动画是指在确定好两个关键帧之后，由计算机自动生成这两帧之间插补帧，从而实现动画的过程。
        this.tweens.add({
            // platforms的哪个台子添加补间动画
            targets: [this.platforms[1 - this.mainPlatform]],
            // 补间动画到达的位置
            x: destination,
            // 补间动画到达后的宽度（会从上面第二个台子的初始宽度变到这个宽度的）
            displayWidth: size,
            // 动画时长
            duration: gameOptions.scrollTime,
            // 回调函数的作用域（这样回调方法中的this就是这个CLASS）
            callbackScope: this,
            // 动画完成时调用方法
            onComplete: function(){
                // 给游戏状态改为等待（gameMode是自定义的属性）
                this.gameMode = WAITING;
            }
        })
    }
    // 初始化人物
    addPlayer(){
        // 确定人物的位置（x：第一个台子的宽度减去距右边缘的距离；y：游戏画布的高度减去台子的高度）
        this.player = this.add.sprite(this.platforms[this.mainPlatform].displayWidth - gameOptions.poleWidth, game.config.height - gameOptions.platformHeight, "tile");
        // 人物的宽度
        this.player.displayWidth = gameOptions.playerWidth;
        // 人物的高度
        this.player.displayHeight = gameOptions.playerHeight;
        // 人物的源点（刚才的定位都是定位源点，如果不移动源点，人物就会和台子重合）
        this.player.setOrigin(1, 1)
    }
    // 初始化桥
    addPole(){
        // 确定桥的位置（x：第一个台子的宽度；y：游戏画布的高度减去台子的高度）
        this.pole = this.add.sprite(this.platforms[this.mainPlatform].displayWidth, game.config.height - gameOptions.platformHeight, "tile");
        // 桥的源点
        this.pole.setOrigin(1, 1);
        // 桥的宽度
        this.pole.displayWidth = gameOptions.poleWidth;
        // 桥的高度
        this.pole.displayHeight = gameOptions.playerHeight / 4;
    }
    // 鼠标按下触发方法
    grow(){
        // 如果当前游戏的状态为等待
        if(this.gameMode == WAITING){
            // 改变游戏状态操作状态
            this.gameMode = GROWING;
            // 添加补间动画（growTween是自定义属性）
            this.growTween = this.tweens.add({
                // 补间动画为桥
                targets: [this.pole],
                // 补间动画结束时的高度（两个台子之期间最大距离加上台子最大宽度）
                displayHeight: gameOptions.platformGapRange[1] + gameOptions.platformWidthRange[1],
                // 补间动画时长
                duration: gameOptions.growTime
            });
            // 也就是说一直按着鼠标的桥的最长距离
        }
    }
    // 监听鼠标离开
    stop(){
        // 当游戏状态为操作状态
        if(this.gameMode == GROWING){
            // 设置游戏状态为执行
            this.gameMode = IDLE;
            // 停止补间动画
            this.growTween.stop();
            // 桥不短<如果桥的长度（竖着时候为高）大于另外一个台子（不是小人站着的台子）的x距离减去桥的x距离>
            if(this.pole.displayHeight > this.platforms[1 - this.mainPlatform].x - this.pole.x){
                // 添加补间动画（搭桥）
                this.tweens.add({
                    // 这个桥
                    targets: [this.pole],
                    angle: 90, // 顺时针转动90度
                    duration: gameOptions.rotateTime, // 动画时长
                    ease: "Bounce.easeOut", // 动画曲线（提供了多达 44 种动画速度曲线）
                    callbackScope: this,// 绑定this
                    onComplete: function(){ // 回调触发的方法
                        // 如果桥正好
                        if(this.pole.displayHeight < this.platforms[1 - this.mainPlatform].x + this.platforms[1 - this.mainPlatform].displayWidth - this.pole.x){
                            // 添加补间动画（小人向右走）
                            this.tweens.add({
                                // 人物
                                targets: [this.player],
                                // 桥的位置，（第二个台子的x加上第二个台子的宽度减去桥的宽度）就是小人向右走的位置
                                x: this.platforms[1 - this.mainPlatform].x + this.platforms[1 - this.mainPlatform].displayWidth - this.pole.displayWidth,
                                // 补间动画时长
                                duration: gameOptions.walkTime,
                                // 补间动画绑定this
                                callbackScope: this,
                                // 回调函数
                                onComplete: function(){
                                    // 补间动画（小人走到终点后动画）
                                    this.tweens.add({
                                        // 人，桥，第二个台子，第一个台子
                                        targets: [this.player, this.pole, this.platforms[1 - this.mainPlatform], this.platforms[this.mainPlatform]],
                                        props: {
                                            x: {
                                                value: "-= " +  this.platforms[1 - this.mainPlatform].x
                                            }
                                        },
                                        // 补间动画时长
                                        duration: gameOptions.scrollTime,
                                        // 补间动画绑定this
                                        callbackScope: this,
                                        // 回调函数
                                        onComplete: function(){
                                            // 下个场景
                                            this.prepareNextMove();
                                        }
                                    })
                                }
                            })
                        }
                        else{
                            this.platformTooLong();
                        }
                    }
                })
            }
            else{
                this.platformTooShort();
            }
        }
    }
    // 桥太长
    platformTooLong(){
        // 添加小人向右移动
        this.tweens.add({
            // 小人
            targets: [this.player],
            // 补间动画x轴（桥x+桥高度+小人宽度）
            x: this.pole.x + this.pole.displayHeight + this.player.displayWidth,
            // 动画时长
            duration: gameOptions.walkTime,
            // 绑定this
            callbackScope: this,
            // 回调函数
            onComplete: function(){
                this.fallAndDie();
            }
        })
    }
    // 桥太短
    platformTooShort(){
        // 给桥添加动画
        this.tweens.add({
            // 桥
            targets: [this.pole],
            // 转动90度
            angle: 90,
            // 时间
            duration: gameOptions.rotateTime,
            // 动画效果
            ease: "Cubic.easeIn",
            // 绑定this
            callbackScope: this,
            // 返回函数
            onComplete: function(){
                // 添加动画小人向右走
                this.tweens.add({
                    // 小人
                    targets: [this.player],
                    // 小人终点位置
                    x: this.pole.x + this.pole.displayHeight,
                    // 小人行走时间
                    duration: gameOptions.walkTime,
                    // 绑定this
                    callbackScope: this,
                    // 回调函数
                    onComplete: function(){
                        //补间动画（桥掉）
                        this.tweens.add({
                            // 桥
                            targets: [this.pole],
                            // 旋转180度
                            angle: 180,
                            // 旋转时长
                            duration: gameOptions.rotateTime,
                            // 动画效果
                            ease: "Cubic.easeIn"
                        })
                        // 小人掉落
                        this.fallAndDie();
                    }
                })
            }
        })
    }
    // 小人掉落
    fallAndDie(){
        // 修改显示的积分为GAME OVER
        scoreText.setText('GAME OVER:'+ score);
        // 补间动画（小人掉落）
        this.tweens.add({
            // 小人
            targets: [this.player],
            // 补间动画结束小人的y轴位置
            y: game.config.height + this.player.displayHeight * 2,
            // 动画时长
            duration: gameOptions.fallTime,
            // 动画效果
            ease: "Cubic.easeIn",
            // 绑定this
            callbackScope: this,
            // 回调函数
            onComplete: function(){
                this.cameras.main.shake(800, 0.01); //相机晃动，震动效果
                // 添加监听事件
                this.time.addEvent({
                    // 两秒后执行
                    delay: 2000,
                    // 绑定this
                    callbackScope: this,
                    // 回调函数
                    callback: function(){
                        /*// 重置分数
                        score = 0;
                        // 重新开始游戏
                        this.scene.start("PlayGame1");*/
                        document.getElementById("button").style.display="";
                    }
                })
            }
        })
    }
    // 桥正好（切换到下一次操作）
    prepareNextMove(){
        // 分数+10
        score += 10;
        // 修改显示的积分
        scoreText.setText('Score: ' + score);
        // 把刚才小人所在的台子放到画布外（暂时看不到）
        this.platforms[this.mainPlatform].x = game.config.width;
        // 切换当前小人所在的台子
        this.mainPlatform = 1 - this.mainPlatform;
        // 补间动画，把画布外的台子放到画布内
        this.tweenPlatform();
        // 桥的角度设为0
        this.pole.angle = 0;
        // 设置桥的位置（这个台子右侧边上）
        this.pole.x = this.platforms[this.mainPlatform].displayWidth;
        // 桥的高度为小人到右侧悬崖的距离
        this.pole.displayHeight = gameOptions.poleWidth;
    }
};
// 根据监听的浏览器窗口大小，改变canvas大小
function resize(){
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}