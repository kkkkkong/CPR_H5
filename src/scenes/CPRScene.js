import { AudioGenerator } from '../utils/audioGenerator';
import { Background } from './Background';

export default class CPRScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CPRScene' });
        this.compressionCount = 0;
        this.breathCount = 0;
        this.currentPhase = 'check'; // check, call, airway, compression, breath
        this.lastCompressionTime = 0;
        this.compressionRate = 0;
        this.compressionDepth = 0;
        this.audioContext = null;
        this.isGameOver = false;
        this.score = 0;
        this.lastOptionClickTime = 0;  // 添加选项点击时间记录
        this.optionClickCooldown = 2000;  // 添加选项点击冷却时间（2秒）
    }

    preload() {
        // 加载场景特定资源
        this.load.image('patient', './assets/images/patient.svg');
        this.load.image('hands', './assets/images/hands.svg');
        this.load.image('logo', './assets/images/logo2.png');  // 修改logo加载路径
        
        // 加载音效
        this.load.audio('select', './assets/audio/select.mp3');
        this.load.audio('success', './assets/audio/success.mp3');
        this.load.audio('error', './assets/audio/error.mp3');
        this.load.audio('metronome', './assets/audio/metronome.mp3');
    }

    create() {
        // 设置游戏画面缩放
        this.scale.setGameSize(window.innerWidth, window.innerHeight);
        this.scale.resize(window.innerWidth, window.innerHeight);
        this.scale.setParentSize(window.innerWidth, window.innerHeight);
        
        // 创建场景元素
        this.createSceneElements();
        this.createInteractiveElements();
        this.createPatient();
        this.createUI();
        this.setupInput();
        this.setupAudio();

        // 创建初始阶段
        this.createPhase('introduction');  // 修改为'introduction'而不是'check'
        
        // 创建教程按钮
        this.createTutorialButton();
        
        // 添加窗口大小变化监听
        window.addEventListener('resize', () => {
            this.scale.resize(window.innerWidth, window.innerHeight);
            this.scale.setParentSize(window.innerWidth, window.innerHeight);
            this.updateLayout();
        });

        // 创建云层
        const clouds = this.add.graphics();
        clouds.setDepth(1);
        
        // 创建云层动画
        const createClouds = () => {
            clouds.clear();
            clouds.fillStyle(0xFFFFFF, 0.8);
            
            // 绘制多朵云
            for (let i = 0; i < 7; i++) {
                const x = (i * 500 + this.cloudOffset) % (window.innerWidth + 400) - 200;
                const y = window.innerHeight * 0.1 + Math.sin(i) * 200;
                
                // 绘制云朵
                clouds.beginPath();
                clouds.arc(x, y, 20, 0, Math.PI * 2);
                clouds.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
                clouds.arc(x + 30, y, 20, 0, Math.PI * 2);
                clouds.arc(x + 15, y + 10, 15, 0, Math.PI * 2);
                clouds.fill();
            }
        };
        
        // 初始化云层偏移量
        this.cloudOffset = 100;
        
        // 创建云层动画
        this.time.addEvent({
            delay: 16,  // 约60fps
            callback: () => {
                this.cloudOffset += 0.5;  // 控制移动速度
                createClouds();
            },
            loop: true
        });
        
        // 初始绘制云层
        createClouds();
    }

    updateLayout() {
        // 更新患者位置
        this.patient.setPosition(window.innerWidth * 0.7, window.innerHeight / 2);
        
        // 更新按压区域位置（保持固定在胸前正中间）
        if (this.pressArea && this.pressAreaPosition) {
            const patientX = window.innerWidth * 0.7;
            const patientY = window.innerHeight / 2;
            const scale = 2.5;
            
            this.pressAreaPosition.x = patientX;
            this.pressAreaPosition.y = patientY + 20 * scale; // 调整到胸部正中间位置
            
            // 不再绘制半透明红色框
            this.pressArea.clear();
        }
        
        // 更新按压提示位置
        if (this.pressingHint) {
            this.pressingHint.setPosition(
                this.pressAreaPosition ? this.pressAreaPosition.x : window.innerWidth * 0.7,
                this.pressAreaPosition ? this.pressAreaPosition.y : window.innerHeight / 2
            );
        }
        
        // 更新选项容器位置
        this.optionsContainer.setPosition(400, window.innerHeight / 2);
        
        // 更新阶段提示文本位置
        this.phaseText.setPosition(400, window.innerHeight / 2 - 150);

        // 更新UI元素位置
        if (this.rateText) {
            this.rateText.setPosition(100, 20);
        }
        if (this.countText) {
            this.countText.setPosition(100, 60);
        }
        if (this.scoreText) {
            this.scoreText.setPosition(100, 100);
        }
        if (this.tutorialButton) {
            this.tutorialButton.setPosition(window.innerWidth - 150, 50);
        }
        if (this.pressHint) {
            this.pressHint.setPosition(window.innerWidth * 0.7, window.innerHeight / 2 - 200);
        }
        if (this.pressArea) {
            if (this.currentPhase === 'compression') {
                this.pressArea.setPosition(window.innerWidth * 0.7, window.innerHeight / 2);
            } else {
                this.pressArea.setPosition(window.innerWidth * 0.7, window.innerHeight / 2 - 200);
            }
        }
        if (this.optionsContainer) {
            this.optionsContainer.setPosition(400, window.innerHeight / 2);
        }

        // 更新背景
        if (this.background) {
            this.background.clear();
            this.background.fillStyle(0x87CEEB);
            this.background.fillRect(0, 0, window.innerWidth, window.innerHeight);
        }
    }

    createSceneElements() {
        // 创建背景元素
        this.background = this.add.graphics();
        this.background.setDepth(0);
        this.background.fillStyle(0x87CEEB); // 天蓝色背景
        this.background.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // 创建地面
        this.ground = this.add.graphics();
        this.ground.setDepth(1);
        this.ground.fillStyle(0x90EE90); // 浅绿色地面
        this.ground.fillRect(0, window.innerHeight * 0.7, window.innerWidth, window.innerHeight * 0.3);

        // 创建环境装饰
        this.createEnvironmentDecorations();
    }

    createEnvironmentDecorations() {
        // 创建树木
        for (let i = 0; i < 3; i++) {
            const tree = this.add.graphics();
            tree.setDepth(1);
            const x = window.innerWidth * (0.2 + i * 0.3);
            const y = window.innerHeight * 0.7;  // 调整树木位置到地面
            
            // 树干
            tree.fillStyle(0x8B4513);
            tree.fillRect(x - 5, y - 40, 10, 40);  // 调整树干位置
            
            // 树冠
            tree.fillStyle(0x228B22);
            tree.beginPath();
            tree.moveTo(x - 20, y - 40);  // 调整树冠位置
            tree.lineTo(x + 20, y - 40);
            tree.lineTo(x, y - 80);  // 调整树冠高度
            tree.closePath();
            tree.fill();
        }

        // 创建猫头型输变电铁塔
        for (let i = 0; i < 4; i++) {  // 保持4个铁塔
            const tower = this.add.graphics();
            tower.setDepth(1);
            // 调整铁塔位置，使其位于草地上
            const x = window.innerWidth * (0.01 + i * 0.35);  // 调整铁塔间距，从0.2改为0.25，起始位置从0.2改为0.15
            const y = window.innerHeight * 0.71;  // 调整到地面位置
            
            // 设置线条样式
            tower.lineStyle(3, 0x808080);  // 灰色线条，宽度3像素
            
            // 绘制塔身（梯形结构）
            const height = 150;  // 塔高
            const bottomWidth = 50;    // 底部宽度
            const topWidth = 30;       // 顶部宽度
            
            // 绘制塔身主体
            tower.beginPath();
            // 左侧斜线
            tower.moveTo(x - bottomWidth/2, y);
            tower.lineTo(x - topWidth/2, y - height/2);
            tower.lineTo(x - topWidth, y - height);
            // 右侧斜线
            tower.moveTo(x + bottomWidth/2, y);
            tower.lineTo(x + topWidth/2, y - height/2);
            tower.lineTo(x + topWidth, y - height);
            // 底部横线
            tower.moveTo(x - bottomWidth/2, y);
            tower.lineTo(x + bottomWidth/2, y);
            // 顶部横线
            tower.moveTo(x - topWidth, y - height);
            tower.lineTo(x + topWidth, y - height);
            tower.strokePath();
            
            // 绘制塔身横撑
            for (let j = 1; j < 4; j++) {
                const h = y - (height * j / 4);
                const w = bottomWidth - (bottomWidth - topWidth) * (j / 4);
                tower.beginPath();
                tower.moveTo(x - w/2, h);
                tower.lineTo(x + w/2, h);
                tower.strokePath();
            }
            
            // 绘制猫头型塔头
            tower.beginPath();
            // 左侧猫耳
            tower.moveTo(x - topWidth, y - height);
            tower.lineTo(x - topWidth - 15, y - height - 20);
            tower.lineTo(x - topWidth + 5, y - height - 20);
            tower.closePath();
            tower.strokePath();
            
            // 右侧猫耳
            tower.beginPath();
            tower.moveTo(x + topWidth, y - height);
            tower.lineTo(x + topWidth - 5, y - height - 20);
            tower.lineTo(x + topWidth + 15, y - height - 20);
            tower.closePath();
            tower.strokePath();
            
            // 绘制横担
            tower.beginPath();
            // 左侧横担
            tower.moveTo(x - topWidth - 10, y - height - 20);
            tower.lineTo(x - topWidth - 25, y - height - 20);
            // 右侧横担
            tower.moveTo(x + topWidth + 10, y - height - 20);
            tower.lineTo(x + topWidth + 25, y - height - 20);
            tower.strokePath();
            
            // 绘制横担支撑
            tower.beginPath();
            // 左侧横担支撑
            tower.moveTo(x - topWidth - 10, y - height - 20);
            tower.lineTo(x - topWidth - 15, y - height - 15);
            tower.moveTo(x - topWidth - 25, y - height - 20);
            tower.lineTo(x - topWidth - 20, y - height - 15);
            // 右侧横担支撑
            tower.moveTo(x + topWidth + 10, y - height - 20);
            tower.lineTo(x + topWidth + 15, y - height - 15);
            tower.moveTo(x + topWidth + 25, y - height - 20);
            tower.lineTo(x + topWidth + 20, y - height - 15);
            tower.strokePath();
            
            // 绘制绝缘子串
            tower.beginPath();
            // 左侧绝缘子串
            tower.moveTo(x - topWidth - 25, y - height - 5);  // 起始点
            tower.lineTo(x - topWidth - 25, y - height + 5);  // 向上延伸
            // 右侧绝缘子串
            tower.moveTo(x + topWidth + 25, y - height - 5);  // 起始点
            tower.lineTo(x + topWidth + 25, y - height + 5);  // 向上延伸
            tower.strokePath();
            
            // 绘制绝缘子
            for (let j = 0; j < 5; j++) {  // 增加绝缘子数量
                const h = y - height - 35 + j * 4;  // 向上排列绝缘子
                // 左侧绝缘子
                tower.beginPath();
                tower.arc(x - topWidth - 25, h+20, 2, 0, Math.PI * 2);
                tower.strokePath();
                // 右侧绝缘子
                tower.beginPath();
                tower.arc(x + topWidth + 25, h+20, 2, 0, Math.PI * 2);
                tower.strokePath();
            }

            // 绘制连接线路（除了最后一个铁塔）
            if (i < 3) {
                const nextX = window.innerWidth * (0.01 + (i + 1) * 0.35);  // 调整下一个铁塔的x坐标
                const midX = (x + nextX) / 2;  // 中间点x坐标
                const sag = 30;  // 增加弧线下垂高度，从25改为30
                const segments = 20;  // 使用20段直线
                
                // 绘制左侧连接线路（20段直线模拟弧线）
                tower.beginPath();
                tower.moveTo(x - topWidth - 25, y - height + 5);  // 起点
                
                // 计算每段的x和y坐标
                for (let j = 1; j <= segments; j++) {
                    const t = j / segments;  // 参数t从0到1
                    const segmentX = x - topWidth - 25 + (nextX - x) * t;  // 线性插值计算x坐标
                    const segmentY = y - height + 5 + sag * Math.sin(t * Math.PI);  // 使用正弦函数计算y坐标
                    tower.lineTo(segmentX, segmentY);
                }
                tower.strokePath();
                
                // 绘制右侧连接线路（20段直线模拟弧线）
                tower.beginPath();
                tower.moveTo(x + topWidth + 25, y - height + 5);  // 起点
                
                // 计算每段的x和y坐标
                for (let j = 1; j <= segments; j++) {
                    const t = j / segments;  // 参数t从0到1
                    const segmentX = x + topWidth + 25 + (nextX - x) * t;  // 线性插值计算x坐标
                    const segmentY = y - height + 5 + sag * Math.sin(t * Math.PI);  // 使用正弦函数计算y坐标
                    tower.lineTo(segmentX, segmentY);
                }
                tower.strokePath();
            }
            
            // 绘制塔基
            tower.beginPath();
            tower.moveTo(x - bottomWidth/2 - 5, y);
            tower.lineTo(x - bottomWidth/2 + 5, y);
            tower.moveTo(x + bottomWidth/2 - 5, y);
            tower.lineTo(x + bottomWidth/2 + 5, y);
            tower.strokePath();
        }

        // 创建风力发电机组
        for (let i = 0; i < 2; i++) {
            const windTurbine = this.add.graphics();
            windTurbine.setDepth(2);
            const x = window.innerWidth * (0.1 + i * 0.8);
            const y = window.innerHeight * 0.7;
            
            // 杆塔
            windTurbine.fillStyle(0x808080);
            windTurbine.beginPath();
            windTurbine.moveTo(x - 12, y);
            windTurbine.lineTo(x + 12, y);
            windTurbine.lineTo(x + 6, y - 150);
            windTurbine.lineTo(x - 6, y - 150);
            windTurbine.closePath();
            windTurbine.fill();
            
            // 机舱
            windTurbine.fillStyle(0xFFFFFF);
            windTurbine.fillCircle(x, y - 150, 8);
            
            // 创建扇叶容器
            const blades = this.add.container(x, y - 150);
            blades.setDepth(2);
            
            // 绘制扇叶
            const drawBlades = () => {
                const graphics = this.add.graphics();
                graphics.fillStyle(0xFFFFFF);
                
                for (let j = 0; j < 3; j++) {
                    const angle = (j * 120 + 30) * Math.PI / 180;
                    const bladeLength = 60;
                    const bladeWidth = 5;  // 叶片宽度
                    
                    // 计算直角梯形的四个顶点
                    const startX = 0;
                    const startY = 0;
                    const endX = Math.cos(angle) * bladeLength;
                    const endY = Math.sin(angle) * bladeLength;
                    
                    // 计算垂直方向的偏移量
                    const perpX = -Math.sin(angle) * bladeWidth;
                    const perpY = Math.cos(angle) * bladeWidth;
                    
                    // 绘制直角梯形
                    graphics.beginPath();
                    graphics.moveTo(startX, startY);
                    graphics.lineTo(startX + perpX, startY + perpY);
                    graphics.lineTo(endX + perpX, endY + perpY);
                    graphics.lineTo(endX, endY);
                    graphics.closePath();
                    graphics.fill();
                }
                
                return graphics;
            };
            
            // 添加扇叶到容器
            const bladeGraphics = drawBlades();
            blades.add(bladeGraphics);
            
            // 创建旋转动画
            this.tweens.add({
                targets: blades,
                angle: 360,
                duration: 5000,
                repeat: -1,
                ease: 'Linear'
            });
        }
    }

    createInteractiveElements() {
        // 创建可交互的背景元素
        this.interactiveElements = this.add.group();
        this.interactiveElements.setDepth(2);

        // 创建可点击的树叶
        for (let i = 0; i < 5; i++) {
            const leaf = this.add.graphics();
            leaf.setInteractive();
            leaf.setDepth(2);
            
            const x = window.innerWidth * (0.2 + i * 0.3);
            const y = window.innerHeight * 0.7 - 40;  // 调整树叶位置到树干顶部
            
            leaf.fillStyle(0x32CD32);
            leaf.beginPath();
            leaf.moveTo(x, y);
            leaf.lineTo(x + 20, y + 20);
            leaf.lineTo(x - 20, y + 20);
            leaf.closePath();
            leaf.fill();

            // 添加悬停效果
            leaf.on('pointerover', () => {
                leaf.setScale(1.2);
                leaf.setTint(0x00FF00);
            });

            leaf.on('pointerout', () => {
                leaf.setScale(1);
                leaf.clearTint();
            });

            this.interactiveElements.add(leaf);
        }

        // 创建按压区域
        this.pressArea = this.add.graphics();
        this.pressArea.setDepth(10); // 提高按压区域深度值，确保显示在人物之上

    }

    createPhaseSpecificElements() {
        // 清理之前的动画
        if (this.tapAnimation) {
            this.tapAnimation.stop();
            this.tapAnimation = null;
        }
        if (this.phoneAnimation) {
            this.phoneAnimation.stop();
            this.phoneAnimation = null;
        }
        if (this.headIndicatorAnimation) {
            this.headIndicatorAnimation.stop();
            this.headIndicatorAnimation = null;
        }

        switch(this.currentPhase) {
            case 'check':
                this.createCheckConsciousnessElements();
                break;
            case 'call':
                this.createCallHelpElements();
                break;
            case 'airway':
                this.createOpenAirwayElements();
                break;
        }
    }

    createCheckConsciousnessElements() {
        // 移除轻拍提示区域相关代码
    }

    createCallHelpElements() {
        // 移除手机图标相关代码
    }

    createOpenAirwayElements() {
        // 移除头部指示器相关代码
    }

    handleTap() {
        // 播放轻拍音效
        this.sounds.tap.play();
        
        // 显示轻拍效果
        const tapEffect = this.add.graphics();
        tapEffect.setDepth(4);
        
        const x = window.innerWidth * 0.7;
        const y = window.innerHeight * 0.4;
        
        tapEffect.fillStyle(0xFFFFFF, 0.5);
        tapEffect.fillCircle(x, y, 20);
        
        this.tweens.add({
            targets: tapEffect,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => tapEffect.destroy()
        });
    }

    handlePhoneCall() {
        // 移除手机交互相关代码
    }

    createPatient() {
        // 创建患者容器
        const patientContainer = this.add.container(0, 0);
        patientContainer.setDepth(5);
        
        // 创建患者图形
        const patient = this.add.graphics();
        patientContainer.add(patient);
        
        // 设置患者位置
        const patientX = window.innerWidth * 0.7;
        const patientY = window.innerHeight / 2;
        
        // 设置缩放比例
        const scale = 2.5;
        
        // 绘制头部（扁平化风格）- 使用圆形
        patient.fillStyle(0xFFE4C4); // 皮肤色
        patient.beginPath();
        patient.arc(0, -60 * scale, 35 * scale, 0, Math.PI * 2); // 增加头部半径
        patient.closePath();
        patient.fill();
        
        // 绘制颈部（扁平化风格）- 使用矩形
        patient.fillStyle(0xFFE4C4);
        patient.fillRect(-12 * scale, -30 * scale, 24 * scale, 12 * scale); // 调整颈部宽度
        
        // 绘制头发（扁平化风格）- 使用半圆形
        patient.fillStyle(0x000000);
        patient.beginPath();
        patient.arc(0, -65 * scale, 40 * scale, Math.PI, 0, false); // 增加头发半径
        patient.closePath();
        patient.fill();
        
        // 绘制安全帽（扁平化风格）
        patient.fillStyle(0xFFD700); // 黄色安全帽
        // 绘制安全帽主体（半圆形）
        patient.beginPath();
        patient.arc(0, -80 * scale, 42 * scale, Math.PI, 0, false); // 调整安全帽大小
        patient.closePath();
        patient.fill();
        
        // 添加安全帽阴影
        patient.fillStyle(0xFFD700); // 使用深一点的橙色作为阴影
        patient.beginPath();
        patient.arc(0, -80 * scale, 42 * scale, Math.PI, 0, false);
        patient.closePath();
        patient.fill();
        
        // 绘制安全帽帽檐
        patient.fillStyle(0xFFD700);
        patient.fillRect(-45 * scale, -80 * scale, 90 * scale, 12 * scale); // 调整帽檐宽度
        
        // 绘制国家电网图标
        const logo = this.add.image(0, -100 * scale, 'logo');
        logo.setScale(0.10 * scale);
        logo.setDepth(6);
        logo.setOrigin(0.5, 0.5);
        
        // 将logo添加到患者容器中
        patientContainer.add(logo);
        
        // 绘制面部特征（扁平化风格）
        // 眼睛 - 使用圆形，调整位置
        patient.fillStyle(0x000000);
        patient.beginPath();
        patient.arc(-15 * scale, -55 * scale, 4 * scale, 0, Math.PI * 2); // 调整眼睛大小和位置
        patient.arc(15 * scale, -55 * scale, 4 * scale, 0, Math.PI * 2);
        patient.closePath();
        patient.fill();
        
        // 眉毛 - 使用直线，调整位置
        patient.lineStyle(3 * scale, 0x000000);
        patient.beginPath();
        patient.moveTo(-20 * scale, -62 * scale); // 调整眉毛位置
        patient.lineTo(-10 * scale, -62 * scale);
        patient.moveTo(10 * scale, -62 * scale);
        patient.lineTo(20 * scale, -62 * scale);
        patient.strokePath();
        
        // 嘴巴 - 使用弧线，调整位置
        patient.lineStyle(3 * scale, 0x000000);
        patient.beginPath();
        patient.arc(0, -40 * scale, 5 * scale, 0, Math.PI); // 调整嘴巴位置和大小
        patient.strokePath();
        
        // 鼻子 - 添加简单的鼻子
        patient.lineStyle(2 * scale, 0x000000);
        patient.beginPath();
        patient.moveTo(0, -52 * scale);
        patient.lineTo(0, -48 * scale);
        patient.strokePath();
        
        // 绘制身体（扁平化风格）- 使用矩形 
        patient.fillStyle(0x4169E1); // 蓝色工作服
        // 绘制矩形
        patient.beginPath();
        patient.fillRect(-25 * scale, -20 * scale, 50 * scale, 70 * scale);
        patient.arc(-25 * scale + 10 * scale, -20 * scale + 10 * scale, 10 * scale, Math.PI, Math.PI * 1.5); // 左上圆角
        patient.lineTo(25 * scale - 10 * scale, -20 * scale); // 上边
        patient.arc(25 * scale - 10 * scale, -20 * scale + 10 * scale, 10 * scale, Math.PI * 1.5, 0); // 右上圆角
        patient.lineTo(25 * scale, 70 * scale - 10 * scale); // 右边
        patient.arc(25 * scale - 10 * scale, 70 * scale - 10 * scale, 10 * scale, 0, Math.PI * 0.5); // 右下圆角
        patient.lineTo(-25 * scale + 10 * scale, 70 * scale); // 下边
        patient.arc(-25 * scale + 10 * scale, 70 * scale - 10 * scale, 10 * scale, Math.PI * 0.5, Math.PI); // 左下圆角
        patient.lineTo(-25 * scale, -20 * scale + 10 * scale); // 左边
        patient.closePath();
        patient.fill();
        
        // 绘制衣领
        patient.fillStyle(0xFFFFFF); // 白色衣领
        patient.beginPath();
        patient.moveTo(-15 * scale, -20 * scale);
        patient.lineTo(0, -10 * scale);
        patient.lineTo(15 * scale, -20 * scale);
        patient.closePath();
        patient.fill();
        
        // 绘制纽扣
        patient.fillStyle(0x000000); // 黑色纽扣
        for (let i = 0; i < 3; i++) {
            patient.beginPath();
            patient.arc(0, 1 * scale + i * 10 * scale, 3 * scale, 0, Math.PI * 2);
            patient.closePath();
            patient.fill();
        }

        
        // 绘制衣服细节（扁平化风格）- 使用直线
        patient.lineStyle(3 * scale, 0x000080);
        patient.beginPath();
        patient.moveTo(-25 * scale, 30 * scale);
        patient.lineTo(25 * scale, 30 * scale);
        patient.strokePath();
        
        // 绘制手臂（扁平化风格）- 四周使用圆角
        patient.fillStyle(0xFFE4C4);
        patient.fillRect(-35 * scale, -10 * scale, 15 * scale, 40 * scale);
        patient.fillRect(20 * scale, -10 * scale, 15 * scale, 40 * scale);
        // 绘制肩膀（扁平化风格）- 使用圆形
        patient.fillStyle(0xFFE4C4);
        patient.beginPath();
        patient.arc(-27 * scale, -12 * scale, 8 * scale, 0, Math.PI * 2);
        patient.closePath();
        patient.fill();
        patient.beginPath();
        patient.arc(27 * scale, -12 * scale, 8 * scale, 0, Math.PI * 2);
        patient.closePath();
        patient.fill();
        

        // 绘制手部（扁平化风格）- 使用圆形
        patient.fillStyle(0xFFE4C4);
        patient.beginPath();
        patient.arc(-27 * scale, 30 * scale, 8 * scale, 0, Math.PI * 2);
        patient.arc(27 * scale, 30 * scale, 8 * scale, 0, Math.PI * 2);
        patient.closePath();
        patient.fill();
        
        // 绘制腿部（扁平化风格）- 使用矩形
        patient.fillStyle(0x4169E1);
        patient.fillRect(-20 * scale, 65 * scale, 15 * scale, 50 * scale);
        patient.fillRect(5 * scale, 65 * scale, 15 * scale, 50 * scale);
        
        // 绘制裤兜
        patient.fillStyle(0x4169E1); // 深蓝色裤兜
        // 左侧裤兜
        patient.beginPath();
        patient.moveTo(-25 * scale, 60 * scale);
        patient.lineTo(-15 * scale, 60 * scale);
        patient.lineTo(-15 * scale, 100 * scale);
        patient.lineTo(-20 * scale, 100 * scale);
        patient.closePath();
        patient.fill();
        
        // 右侧裤兜
        patient.beginPath();
        patient.moveTo(25 * scale, 60 * scale);
        patient.lineTo(15 * scale, 60 * scale);
        patient.lineTo(15 * scale, 100 * scale);
        patient.lineTo(20 * scale, 100 * scale);
        patient.closePath();
        patient.fill();
        
        // 绘制脚部（扁平化风格）- 使用矩形，右上角使用圆角 
        patient.beginPath();
        patient.fillStyle(0x000000);
        patient.fillRect(-20 * scale, 110 * scale, 15 * scale, 10 * scale);
        patient.fillRect(5 * scale, 110 * scale, 15 * scale, 10 * scale);
        patient.arc(20 * scale, 120 * scale, 10 * scale, Math.PI, 0, false);
        patient.arc(-20 * scale, 120 * scale, 10 * scale, Math.PI, 0, false);

        patient.fill();
        
        // 设置患者容器位置
        patientContainer.setPosition(patientX, patientY);
        
        // 保存患者引用
        this.patient = patientContainer;
        
        // 创建按压区域（固定在胸前正中间）
        this.pressArea = this.add.graphics();
        this.pressArea.setDepth(10); // 提高按压区域深度值，确保显示在人物之上
        
        // 设置按压区域位置（在胸部正中间）
        const pressAreaX = patientX;
        const pressAreaY = patientY + 20 * scale; // 调整到胸部正中间位置
        
        // 保存按压区域位置
        this.pressAreaPosition = { x: patientX, y: patientY + 1 * scale };
        
        // 设置按压区域的交互区域
        this.pressArea.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(-30, -30, 60, 60),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains
        });
        
        // 添加按压动画
        this.patientTween = this.tweens.add({
            targets: this.patient,
            scaleY: 0.95,
            duration: 200,
            yoyo: true,
            repeat: 0,
            paused: true
        });
    }

    createUI() {
        // 创建阶段提示文本
        this.phaseText = this.add.text(400, window.innerHeight / 2 - 150, '检查意识', {
            fontSize: '24px',
            fill: '#FFFFFF',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 },
            fontFamily: 'Microsoft YaHei',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5, 0);
        this.phaseText.setDepth(20); // 提高深度值，确保显示在最上层

        // 创建按压提示文本
        this.pressingHint = this.add.text(this.pressAreaPosition.x, this.pressAreaPosition.y, '点击此处进行按压', {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontFamily: 'Microsoft YaHei',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5, 0.5);

        this.pressingHint.setDepth(20); // 提高深度值，确保显示在最上层

        // 创建UI容器
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setDepth(20); // 提高深度值，确保显示在最上层

        // 创建按压频率背景
        const rateBg = this.add.rectangle(100, 20, 200, 40, 0x3498db);
        rateBg.setAlpha(0.8);
        rateBg.setOrigin(0, 0);

        // 创建按压频率文本
        this.rateText = this.add.text(110, 40, '按压频率: 0 次/分', {
            fontSize: '20px',
            fill: '#FFFFFF',
            fontFamily: 'Microsoft YaHei',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);
        this.rateText.setDepth(20); // 提高深度值，确保显示在最上层

        // 创建按压次数背景
        const countBg = this.add.rectangle(100, 60, 200, 40, 0x2ecc71);
        countBg.setAlpha(0.8);
        countBg.setOrigin(0, 0);

        // 创建按压次数文本
        this.countText = this.add.text(110, 80, '按压次数: 0/30', {
            fontSize: '20px',
            fill: '#FFFFFF',
            fontFamily: 'Microsoft YaHei',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);
        this.countText.setDepth(20); // 提高深度值，确保显示在最上层

        // 创建得分背景
        const scoreBg = this.add.rectangle(100, 100, 200, 40, 0xe74c3c);
        scoreBg.setAlpha(0.8);
        scoreBg.setOrigin(0, 0);

        // 创建得分文本
        this.scoreText = this.add.text(110, 120, '得分: 0', {
            fontSize: '20px',
            fill: '#FFFFFF',
            fontFamily: 'Microsoft YaHei',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);
        this.scoreText.setDepth(20); // 提高深度值，确保显示在最上层

        // 添加圆角效果
        [rateBg, countBg, scoreBg].forEach(bg => {
            bg.setStrokeStyle(2, 0x000000, 0.5);
        });

        // 添加悬停效果
        [rateBg, countBg, scoreBg].forEach(bg => {
            bg.setInteractive();
            bg.on('pointerover', () => {
                this.tweens.add({
                    targets: bg,
                    alpha: 1,
                    duration: 200,
                    ease: 'Power2'
                });
            });
            bg.on('pointerout', () => {
                this.tweens.add({
                    targets: bg,
                    alpha: 0.8,
                    duration: 200,
                    ease: 'Power2'
                });
            });
        });

        // 将UI元素添加到容器
        this.uiContainer.add([rateBg, this.rateText, countBg, this.countText, scoreBg, this.scoreText]);

        // 创建选项容器
        this.optionsContainer = this.add.container(400, window.innerHeight / 2);
        this.optionsContainer.setDepth(20); // 提高深度值，确保显示在最上层
    }

    showTutorial() {
        // 创建半透明背景（像素风格）
        const overlay = this.add.rectangle(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 0x000000, 0.9);
        overlay.setDepth(20);  // 设置背景深度为20，确保在最上层
        
        // 创建教程文本（像素风格）
        const tutorialText = [
            'CPR操作指南：',
            '1. 检查意识：轻拍患者肩膀，观察反应',
            '2. 呼叫救援：大声呼救，拨打急救电话',
            '3. 开放气道：仰头抬颌，保持气道通畅',
            '4. 胸外按压：',
            '   - 按压位置：胸骨下半部',
            '   - 按压深度：5-6厘米',
            '   - 按压频率：100-120次/分钟',
            '   - 按压次数：30次',
            '5. 人工呼吸：',
            '   - 每次吹气1秒',
            '   - 观察胸廓起伏',
            '   - 吹气次数：2次',
            '',
            '点击任意位置关闭说明'
        ];

        const text = this.add.text(window.innerWidth / 2, 100, tutorialText, {
            fontSize: '24px',
            fill: '#fff',
            align: 'left',
            wordWrap: { width: window.innerWidth - 200 },
            fontFamily: 'Microsoft YaHei',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5, 0);
        text.setDepth(21);  // 设置文本深度为21，确保在背景之上

        // 添加关闭按钮
        overlay.setInteractive();
        overlay.on('pointerdown', () => {
            overlay.destroy();
            text.destroy();
        });
    }

    setupInput() {
        // 移除按压区域相关代码
        // 添加按压事件
        this.input.on('pointerdown', (pointer) => {
            if (this.currentPhase === 'compression') {
                // 检查是否按压在红色方框区域内
                if (this.pressAreaPosition && 
                    pointer.x >= this.pressAreaPosition.x - 30 && 
                    pointer.x <= this.pressAreaPosition.x + 30 && 
                    pointer.y >= this.pressAreaPosition.y - 30 && 
                    pointer.y <= this.pressAreaPosition.y + 30) {
                    
                    // 记录按压开始时间
                    this.pressStartTime = Date.now();
                }
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (this.currentPhase === 'compression') {
                // 检查是否按压在红色方框区域内
                if (this.pressAreaPosition && 
                    pointer.x >= this.pressAreaPosition.x - 30 && 
                    pointer.x <= this.pressAreaPosition.x + 30 && 
                    pointer.y >= this.pressAreaPosition.y - 30 && 
                    pointer.y <= this.pressAreaPosition.y + 30) {
                    
                    // 计算按压持续时间
                    const pressDuration = Date.now() - this.pressStartTime;

                    // 如果按压时间在合理范围内（100-300ms）
                    if (pressDuration >= 100 && pressDuration <= 300) {
                        // 播放选择音效
                        AudioGenerator.generateSelect();
                        
                        // 创建点击特效
                        const clickEffect = this.add.circle(pointer.x, pointer.y, 0, 0xffffff, 0.5);
                        
                        this.tweens.add({
                            targets: clickEffect,
                            radius: 30,
                            alpha: 0,
                            duration: 300,
                            ease: 'Quad.easeOut',
                            onComplete: () => {
                                clickEffect.destroy();
                            }
                        });

                        // 隐藏按压提示
                        this.pressingHint.setVisible(false);

                        // 处理按压
                        this.handleCompression(pointer);
                    } else {
                        // 显示按压提示
                        let depthHint = '';
                        if (pressDuration < 100) {
                            depthHint = '按压太快';
                        } else if (pressDuration > 300) {
                            depthHint = '按压太慢';
                        }

                        // 显示提示文字
                        const hintText = this.add.text(pointer.x, pointer.y - 50, depthHint, {
                            fontSize: '20px',
                            fill: '#ff0000',
                            fontFamily: 'Microsoft YaHei',
                            stroke: '#000000',
                            strokeThickness: 4
                        }).setOrigin(0.5, 0.5);
                        hintText.setDepth(5);

                        // 1秒后消失
                        this.time.delayedCall(1000, () => {
                            hintText.destroy();
                        });
                    }
                }
            } else if (this.currentPhase === 'breath') {
                // 处理人工呼吸
                this.handleBreath();
            } else {
                // 根据当前阶段显示相应的选项
                switch(this.currentPhase) {
                    case 'check':
                        this.showOptions('检查意识', [
                            { text: '轻拍肩膀，观察反应', correct: true },
                            { text: '用力摇晃', correct: false },
                            { text: '大声喊叫', correct: false }
                        ]);
                        break;
                    case 'call':
                        this.showOptions('呼叫救援', [
                            { text: '大声呼救，拨打120', correct: true },
                            { text: '等待他人发现', correct: false },
                            { text: '先拍照发朋友圈', correct: false }
                        ]);
                        break;
                    case 'airway':
                        this.showOptions('开放气道', [
                            { text: '仰头抬颌', correct: true },
                            { text: '侧头', correct: false },
                            { text: '低头', correct: false }
                        ]);
                        break;
                }
            }
        });
    }

    startCheck() {
        // 开始检查意识
        this.pressHint.setText('点击继续');
        
        // 添加淡入动画
        this.tweens.add({
            targets: this.patient,
            alpha: 1,
            duration: 1000,
            ease: 'Power2'
        });
        
        // 添加检查动画
        this.showCheckAnimation();
        
        // 延迟后显示选项
        this.time.delayedCall(2000, () => {
            this.showOptions('检查意识', [
                { text: '轻拍肩膀，观察反应', correct: true },
                { text: '用力摇晃', correct: false },
                { text: '大声喊叫', correct: false }
            ]);
        });
    }

    showCheckAnimation() {
        // 创建检查动画效果
        const checkEffect = this.add.circle(window.innerWidth / 2, window.innerHeight / 2, 0, 0xffffff, 0.5);
        
        this.tweens.add({
            targets: checkEffect,
            radius: 100,
            alpha: 0,
            duration: 1000,
            ease: 'Quad.easeOut',
            onComplete: () => {
                checkEffect.destroy();
            }
        });

        // 添加闪烁效果
        this.tweens.add({
            targets: this.patient,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut'
        });
    }

    showPhaseTransition(phaseName) {
        // 创建过渡遮罩
        const mask = this.add.rectangle(window.innerWidth / 2, window.innerHeight / 2, 800, 600, 0x000000);
        mask.setAlpha(0);
        
        // 创建阶段名称文本
        const text = this.add.text(window.innerWidth / 2, 300, phaseName, {
            fontSize: '48px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 20, y: 10 },
            fontFamily: 'Press Start 2P'
        }).setOrigin(0.5, 0.5);
        text.setAlpha(0);
        
        // 添加过渡动画
        this.tweens.add({
            targets: mask,
            alpha: 0.5,
            duration: 500,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: [mask, text],
                    alpha: 0,
                    duration: 500,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        mask.destroy();
                        text.destroy();
                    }
                });
            }
        });
        
        this.tweens.add({
            targets: text,
            alpha: 1,
            duration: 500,
            ease: 'Quad.easeOut'
        });

        // 添加过渡粒子效果
        for (let i = 0; i < 30; i++) {
            const particle = this.add.circle(window.innerWidth / 2, 300, 2, 0xffffff);
            
            const angle = (i / 30) * Math.PI * 2;
            const distance = 100;
            
            this.tweens.add({
                targets: particle,
                x: window.innerWidth / 2 + Math.cos(angle) * distance,
                y: 300 + Math.sin(angle) * distance,
                alpha: 0,
                duration: 500,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    handleBreath() {
        this.breathCount++;
        this.phaseText.setText(`人工呼吸 (${this.breathCount}/2)`);
        
        // 添加人工呼吸动画
        this.showBreathAnimation();
        
        if (this.breathCount >= 2) {
            // 清除人工呼吸提示文本
            this.pressingHint.setVisible(false);
            
            // 禁用人工呼吸区域的点击事件
            this.pressArea.setInteractive(false);
            
            // 添加过渡文本
            const continueTransitionText = this.add.text(400, window.innerHeight / 2, 
                '2次人工呼吸已完成，\n\n' +
                '现在需要检查患者情况，\n\n' +
                '决定是否继续救治。',
                {
                    fontSize: '24px',
                    fill: '#FFFFFF',
                    fontFamily: 'Microsoft YaHei',
                    stroke: '#000000',
                    strokeThickness: 4,
                    align: 'center',
                    wordWrap: { width: 500 }
                }
            ).setOrigin(0.5, 0.5);
            continueTransitionText.setDepth(100);
            
            // 延迟1秒后自动消失过渡文本并显示选项
            this.time.delayedCall(1000, () => {
                // 销毁过渡文本
                if (continueTransitionText) {
                continueTransitionText.destroy();
                }
                
                // 设置下一个阶段为检查恢复
                this.currentPhase = 'recovery';
                this.phaseText.setText('检查恢复');
                
                // 显示选项
                this.showOptions('继续救治', [
                    { text: '检查患者情况，继续救治', correct: true },
                    { text: '停止救治，等待救护车', correct: false },
                    { text: '离开现场', correct: false }
                ]);
            });
        }
    }

    showBreathAnimation() {
        // 创建呼吸效果
        const breathEffect = this.add.ellipse(window.innerWidth * 0.7, window.innerHeight / 2, 0, 0, 0x00ffff, 0.3);
        breathEffect.setDepth(5);
        
        // 添加呼吸动画
        this.tweens.add({
            targets: breathEffect,
            width: 100,
            height: 50,
            alpha: 0,
            duration: 1000,
            ease: 'Quad.easeOut',
            onComplete: () => {
                breathEffect.destroy();
            }
        });

        // 添加胸廓起伏动画
        this.tweens.add({
            targets: this.patient,
            scaleX: 1.1,
            scaleY: 0.95,
            duration: 500,
            ease: 'Quad.easeOut',
            yoyo: true,
            onComplete: () => {
                this.patient.setScale(1, 1);
            }
        });

        // 添加头部后仰动画
        this.tweens.add({
            targets: this.patient,
            angle: 15,
            duration: 500,
            ease: 'Quad.easeOut',
            yoyo: true,
            onComplete: () => {
                this.patient.setAngle(0);
            }
        });
    }

    setupAudio() {
        // 初始化音频上下文
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 设置节拍器定时器
        this.metronomeInterval = null;
        
        // 添加音频上下文恢复
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    handleCompression(pointer) {
        const now = Date.now();
        const timeSinceLastCompression = now - this.lastCompressionTime;
        
        // 计算按压频率
        this.compressionRate = 60000 / timeSinceLastCompression;
        
        // 更新UI
        this.rateText.setText(`按压频率: ${Math.round(this.compressionRate)}/分钟`);
        this.countText.setText(`按压次数: ${this.compressionCount + 1}/30`);
        
        // 显示按压动画
        this.showCompressionAnimation();
        
        // 检查按压质量
        this.checkCompressionQuality();
        
        // 添加按压质量提示
        let qualityHint = '';
        if (this.compressionRate < 100) {
            qualityHint = '按压太慢';
        } else if (this.compressionRate > 120) {
            qualityHint = '按压太快';
        }

        if (qualityHint) {
            const hint = this.add.text(
                this.pressAreaPosition ? this.pressAreaPosition.x : window.innerWidth * 0.7,
                (this.pressAreaPosition ? this.pressAreaPosition.y : window.innerHeight / 2) - 50,
                qualityHint,
                {
                fontSize: '24px',
                fill: '#ff0000',
                backgroundColor: '#000',
                padding: { x: 10, y: 5 },
                fontFamily: 'Press Start 2P'
                }
            ).setOrigin(0.5, 0.5).setDepth(20);

            this.time.delayedCall(1000, () => {
                hint.destroy();
            });
        }
        
        this.lastCompressionTime = now;
        this.compressionCount++;

        // 检查是否完成30次按压
        if (this.compressionCount >= 30) {
            // 停止节拍器
            if (this.metronomeInterval) {
                clearInterval(this.metronomeInterval);
                this.metronomeInterval = null;
            }
            
            this.currentPhase = 'breath';
            this.phaseText.setText('人工呼吸');
            this.pressingHint.setText('点击此处进行人工呼吸');
            this.pressingHint.setVisible(true);
            this.breathCount = 0;
        }
    }

    checkCompressionQuality() {
        // 确保音频上下文处于活动状态
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // 检查按压频率是否在100-120次/分钟之间
        if (this.compressionRate >= 100 && this.compressionRate <= 120) {
            // 按压频率正确
            AudioGenerator.generateSuccess();
            this.score += 10;
            this.scoreText.setText(`得分: ${this.score}`);
            this.showSuccessEffect();
        } else {
            // 按压频率不正确
            AudioGenerator.generateError();
            this.showErrorEffect();
        }
    }

    showCompressionAnimation() {
        // 创建按压波纹效果
        const ripple = this.add.circle(this.pressAreaPosition.x, this.pressAreaPosition.y, 0, 0xffffff, 0.3);
        ripple.setDepth(5);

        this.tweens.add({
            targets: ripple,
            radius: 30,
            alpha: 0,
            duration: 200,
            ease: 'Quad.easeOut',
            onComplete: () => {
                ripple.destroy();
            }
        });

        // 创建按压深度指示器
        const depthIndicator = this.add.circle(this.pressAreaPosition.x, this.pressAreaPosition.y, 0, 0xff0000, 0.2);
        depthIndicator.setDepth(5);

        this.tweens.add({
            targets: depthIndicator,
            radius: 20,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                depthIndicator.destroy();
            }
        });

        // 创建多层波纹效果
        for (let i = 0; i < 2; i++) {
            const wave = this.add.circle(this.pressAreaPosition.x, this.pressAreaPosition.y, 0, 0xffffff, 0.2);
            wave.setDepth(5);
            
            this.tweens.add({
                targets: wave,
                radius: 25 + i * 5,
                alpha: 0,
                duration: 300,
                delay: i * 30,
                onComplete: () => {
                    wave.destroy();
                }
            });
        }

        // 创建按压粒子效果
        for (let i = 0; i < 6; i++) {
            const particle = this.add.circle(this.pressAreaPosition.x, this.pressAreaPosition.y, 1.5, 0xffffff);
            particle.setDepth(5);
            
            const angle = (i / 6) * Math.PI * 2;
            const distance = 20;
            
            this.tweens.add({
                targets: particle,
                x: window.innerWidth * 0.7 + Math.cos(angle) * distance,
                y: window.innerHeight / 2 + Math.sin(angle) * distance,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }

        // 创建按压区域效果
        const pressArea = this.add.rectangle(this.pressAreaPosition.x, this.pressAreaPosition.y, 80, 80, 0xff0000, 0.15);
        pressArea.setDepth(5);

        this.tweens.add({
            targets: pressArea,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                pressArea.destroy();
            }
        });

        // 增强患者身体动画效果
        // 1. 身体压缩
        this.tweens.add({
            targets: this.patient,
            scaleY: 0.95,  // 压缩到95%
            duration: 100,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: this.patient,
                    scaleY: 1,
                    duration: 100,
                    ease: 'Quad.easeIn'
                });
            }
        });

        // 2. 头部轻微后仰
        this.tweens.add({
            targets: this.patient,
            angle: 3,  // 头部后仰3度
            duration: 100,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: this.patient,
                    angle: 0,
                    duration: 100,
                    ease: 'Quad.easeIn'
                });
            }
        });

        // 3. 手臂摆动效果
        // 创建左手臂
        const leftArm = this.add.graphics();
        leftArm.lineStyle(3, 0x000000);
        leftArm.moveTo(window.innerWidth * 0.7 - 40, window.innerHeight / 2 - 20);
        leftArm.lineTo(window.innerWidth * 0.7 - 60, window.innerHeight / 2 - 40);
        leftArm.setDepth(5);

        // 创建右手臂
        const rightArm = this.add.graphics();
        rightArm.lineStyle(3, 0x000000);
        rightArm.moveTo(window.innerWidth * 0.7 + 40, window.innerHeight / 2 - 20);
        rightArm.lineTo(window.innerWidth * 0.7 + 60, window.innerHeight / 2 - 40);
        rightArm.setDepth(5);

        // 左手臂动画
        this.tweens.add({
            targets: leftArm,
            angle: -15,
            originX: 0.5,
            originY: 0.5,
            duration: 100,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: leftArm,
                    angle: 0,
                    duration: 100,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        leftArm.destroy();
                    }
                });
            }
        });

        // 右手臂动画
        this.tweens.add({
            targets: rightArm,
            angle: 15,
            originX: 0.5,
            originY: 0.5,
            duration: 100,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: rightArm,
                    angle: 0,
                    duration: 100,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        rightArm.destroy();
                    }
                });
            }
        });
    }

    showCompressionDepth() {
        // 创建按压深度指示器
        const depthLine = this.add.line(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth / 2, window.innerHeight / 2 - this.compressionDepth * 10, 0xff0000);
        depthLine.setAlpha(0.5);
        
        // 添加深度指示线动画
        this.tweens.add({
            targets: depthLine,
            alpha: 0,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => {
                depthLine.destroy();
            }
        });
    }

    createCompressionEffect() {
        // 创建按压波纹效果
        const ripple = this.add.circle(window.innerWidth / 2, window.innerHeight / 2, 0, 0xffffff, 0.5);
        
        // 创建按压深度指示器
        const depthRing = this.add.circle(window.innerWidth / 2, window.innerHeight / 2, 0, 0xff0000, 0.3);
        
        this.tweens.add({
            targets: [ripple, depthRing],
            radius: 50,
            alpha: 0,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => {
                ripple.destroy();
                depthRing.destroy();
            }
        });
    }

    createRippleEffect() {
        // 创建多层波纹效果
        for (let i = 0; i < 3; i++) {
            const ripple = this.add.circle(window.innerWidth / 2, window.innerHeight / 2, 0, 0xffffff, 0.5);
            
            this.tweens.add({
                targets: ripple,
                radius: 50 + i * 20,
                alpha: 0,
                duration: 300 + i * 100,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    ripple.destroy();
                }
            });
        }
    }

    createCompressionParticles() {
        // 创建按压粒子效果
        for (let i = 0; i < 10; i++) {
            const particle = this.add.circle(window.innerWidth / 2, window.innerHeight / 2, 2, 0xffffff);
            
            const angle = (i / 10) * Math.PI * 2;
            const distance = 30;
            
            this.tweens.add({
                targets: particle,
                x: window.innerWidth / 2 + Math.cos(angle) * distance,
                y: window.innerHeight / 2 + Math.sin(angle) * distance,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    showSuccessEffect() {
        // 创建成功光环
        const successRing = this.add.circle(window.innerWidth * 0.7, window.innerHeight / 2, 0, 0x00ff00, 0.5);
        successRing.setDepth(5); // 设置深度高于患者模型
        
        this.tweens.add({
            targets: successRing,
            radius: 100,
            alpha: 0,
            duration: 500,
            ease: 'Quad.easeOut',
            onComplete: () => {
                successRing.destroy();
            }
        });

        // 添加成功粒子效果
        for (let i = 0; i < 20; i++) {
            const particle = this.add.circle(window.innerWidth * 0.7, window.innerHeight / 2, 3, 0x00ff00);
            particle.setDepth(5); // 设置深度高于患者模型
            
            const angle = (i / 20) * Math.PI * 2;
            const distance = 100;
            
            this.tweens.add({
                targets: particle,
                x: window.innerWidth * 0.7 + Math.cos(angle) * distance,
                y: window.innerHeight / 2 + Math.sin(angle) * distance,
                alpha: 0,
                duration: 500,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }

        // 添加全屏绿色闪烁效果
        const flash = this.add.rectangle(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 0x00ff00);
        flash.setAlpha(0);
        flash.setDepth(6); // 设置深度高于所有效果
        
        this.tweens.add({
            targets: flash,
            alpha: 0.2,
            duration: 100,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: flash,
                    alpha: 0,
                    duration: 100,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        flash.destroy();
                    }
                });
            }
        });
    }

    showErrorEffect() {
        // 添加错误粒子效果
        for (let i = 0; i < 15; i++) {
            const particle = this.add.circle(window.innerWidth * 0.7, window.innerHeight / 2, 2, 0xff0000);
            particle.setDepth(5); // 设置深度高于患者模型
            
            const angle = (i / 15) * Math.PI * 2;
            const distance = 50;
            
            this.tweens.add({
                targets: particle,
                x: window.innerWidth * 0.7 + Math.cos(angle) * distance,
                y: window.innerHeight / 2 + Math.sin(angle) * distance,
                alpha: 0,
                duration: 300,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }

        // 添加红色闪烁效果
        const flash = this.add.rectangle(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 0xff0000);
        flash.setAlpha(0);
        flash.setDepth(6); // 设置深度高于所有效果
        
        this.tweens.add({
            targets: flash,
            alpha: 0.1,
            duration: 100,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: flash,
                    alpha: 0,
                    duration: 100,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        flash.destroy();
                    }
                });
            }
        });
    }

    update() {
        // 更新游戏状态
        this.updatePhase();
    }

    updatePhase() {
        switch (this.currentPhase) {
            case 'compression':
                if (this.compressionCount >= 30) {
                    // 添加过渡文本
                    const breathTransitionText = this.add.text(400, window.innerHeight / 2, 
                        '30次胸外按压已完成，\n\n' +
                        '现在需要进行人工呼吸，\n\n' +
                        '以帮助患者恢复自主呼吸。',
                        {
                            fontSize: '24px',
                            fill: '#FFFFFF',
                            fontFamily: 'Microsoft YaHei',
                            stroke: '#000000',
                            strokeThickness: 4,
                            align: 'center',
                            wordWrap: { width: 500 }
                        }
                    ).setOrigin(0.5, 0.5);
                    breathTransitionText.setDepth(25);
                    
                    // 添加点击继续功能
                    this.input.once('pointerdown', () => {
                        breathTransitionText.destroy();
                        this.currentPhase = 'breath';
                        this.phaseText.setText('人工呼吸');
                        this.pressingHint.setText('点击此处进行人工呼吸');
                        this.pressingHint.setVisible(true);
                        this.breathCount = 0;
                        this.countText.setText('呼吸次数: 0/2');
                    });
                }
                break;
            case 'breath':
                if (this.breathCount >= 2) {
                    // 添加过渡文本
                    const continueTransitionText = this.add.text(400, window.innerHeight / 2, 
                        '2次人工呼吸已完成，\n\n' +
                        '现在需要检查患者情况，\n\n' +
                        '决定是否继续救治。',
                        {
                            fontSize: '24px',
                            fill: '#FFFFFF',
                            fontFamily: 'Microsoft YaHei',
                            stroke: '#000000',
                            strokeThickness: 4,
                            align: 'center',
                            wordWrap: { width: 500 }
                        }
                    ).setOrigin(0.5, 0.5);
                    continueTransitionText.setDepth(100);
                    
                    // 添加点击继续功能
                    this.input.once('pointerdown', (pointer) => {
                        // 先销毁过渡文本
                        if (continueTransitionText) {
                        continueTransitionText.destroy();
                        }
                        
                        // 延迟500毫秒后再显示选项，确保过渡文本完全消失
                        this.time.delayedCall(500, () => {
                            // 设置下一个阶段为检查恢复
                            this.currentPhase = 'recovery';
                            this.phaseText.setText('检查恢复');
                            
                            // 显示选项
                        this.showOptions('继续救治', [
                            { text: '检查患者情况，继续救治', correct: true },
                            { text: '停止救治，等待救护车', correct: false },
                            { text: '离开现场', correct: false }
                        ]);
                        });
                    });
                }
                break;
        }

        // 创建新阶段的特定元素
        this.createPhaseSpecificElements();
    }

    gameOver() {
        this.isGameOver = true;
        this.phaseText.setText('训练完成');
        this.pressingHint.setText('训练已完成，请刷新页面重新开始');
        
        // 添加完成动画
        this.tweens.add({
            targets: this.patient,
            scale: 1.2,
            duration: 1000,
            ease: 'Power2'
        });
        
        // 显示最终得分和评价
        let evaluation = '';
        if (this.score >= 200) {
            evaluation = '优秀';
        } else if (this.score >= 150) {
            evaluation = '良好';
        } else if (this.score >= 100) {
            evaluation = '及格';
        } else {
            evaluation = '需要继续练习';
        }
        
        const resultText = this.add.text(window.innerWidth / 2, window.innerHeight / 2, `最终得分 ${this.score}\n评价: ${evaluation}`, {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5, 0.5);
        
        // 添加结果文本动画
        resultText.setAlpha(0);
        this.tweens.add({
            targets: resultText,
            alpha: 1,
            duration: 1000,
            ease: 'Power2'
        });
    }

    shutdown() {
        // 清理音频资源
        if (this.metronomeInterval) {
            clearInterval(this.metronomeInterval);
            this.metronomeInterval = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }

    handleOptionSelect(selectedOption, pointer) {
        // 检查是否在冷却时间内
        const now = Date.now();
        if (now - this.lastOptionClickTime < this.optionClickCooldown) {
            return;
        }
        
        this.lastOptionClickTime = now;
        
        // 检查选择是否正确
        const isCorrect = this.checkAnswer(selectedOption);
        
        if (isCorrect) {
            // 播放成功音效
            AudioGenerator.generateSuccess();
            
            // 显示成功效果
            this.showSuccessEffect();
            
            // 增加分数
            this.score += 10;
            this.scoreText.setText(`得分: ${this.score}`);
            
            // 延迟后进入下一阶段
            this.time.delayedCall(1000, () => {
                // 隐藏选项
                this.optionsContainer.setAlpha(0);
                
                // 根据当前阶段进入下一阶段
                switch(this.currentPhase) {
                    case 'recovery':
                        // 显示救治成功提示
                        const recoveryResultText = this.add.text(400, window.innerHeight / 2, 
                            '经过规范的心肺复苏操作，\n\n' +
                            '患者已恢复自主呼吸和意识，\n\n' +
                            '生命体征稳定，等待专业医疗救援。',
                            {
                                fontSize: '24px',
                                fill: '#FFFFFF',
                                fontFamily: 'Microsoft YaHei',
                                stroke: '#000000',
                                strokeThickness: 4,
                                align: 'center',
                                wordWrap: { width: 500 }
                            }
                        ).setOrigin(0.5, 0.5);
                        recoveryResultText.setDepth(100);
                        
                        // 延迟2秒后显示最终得分
                        this.time.delayedCall(2000, () => {
                            recoveryResultText.destroy();
                            this.gameOver();
                        });
                        break;
                    case 'introduction':
                        this.currentPhase = 'check';
                        this.phaseText.setText('检查意识');
                        this.pressingHint.setText('点击继续');
                        this.pressingHint.setVisible(true);
                        this.time.delayedCall(1000, () => {
                            this.showOptions('检查意识', [
                                { text: '轻拍肩膀，观察反应', correct: true },
                                { text: '用力摇晃', correct: false },
                                { text: '大声喊叫', correct: false }
                            ]);
                        });
                        break;
                    case 'check':
                        this.currentPhase = 'call';
                        this.phaseText.setText('呼叫救援');
                        this.pressingHint.setText('点击继续');
                        this.pressingHint.setVisible(true);
                        
                        // 添加过渡文本
                        const callTransitionText = this.add.text(400, window.innerHeight / 2 + 30, 
                            '经过检查，患者没有反应，\n\n' +
                            '意识已经丧失，\n\n' +
                            '需要立即呼叫救援。',
                            {
                                fontSize: '24px',
                                fill: '#FFFFFF',
                                fontFamily: 'Microsoft YaHei',
                                stroke: '#000000',
                                strokeThickness: 4,
                                align: 'center',
                                wordWrap: { width: 500 }
                            }
                        ).setOrigin(0.5, 0.5);
                        callTransitionText.setDepth(25);
                        
                        // 添加点击继续功能
                        this.input.once('pointerdown', () => {
                            callTransitionText.destroy();
                            this.time.delayedCall(1000, () => {
                                this.showOptions('呼叫救援', [
                                    { text: '大声呼救，拨打120', correct: true },
                                    { text: '等待他人发现', correct: false },
                                    { text: '先拍照发朋友圈', correct: false }
                                ]);
                            });
                        });
                        break;
                    case 'call':
                        this.currentPhase = 'airway';
                        this.phaseText.setText('开放气道');
                        this.pressingHint.setText('点击继续');
                        this.pressingHint.setVisible(true);
                        
                        // 添加过渡文本
                        const airwayTransitionText = this.add.text(400, window.innerHeight / 2 + 30, 
                            '救援人员正在赶来，\n\n' +
                            '在等待救援的同时，\n\n' +
                            '需要立即开放患者气道。',
                            {
                                fontSize: '24px',
                                fill: '#FFFFFF',
                                fontFamily: 'Microsoft YaHei',
                                stroke: '#000000',
                                strokeThickness: 4,
                                align: 'center',
                                wordWrap: { width: 500 }
                            }
                        ).setOrigin(0.5, 0.5);
                        airwayTransitionText.setDepth(25);
                        
                        // 添加点击继续功能
                        this.input.once('pointerdown', () => {
                            airwayTransitionText.destroy();
                            this.time.delayedCall(1000, () => {
                                this.showOptions('开放气道', [
                                    { text: '仰头抬颌', correct: true },
                                    { text: '侧头', correct: false },
                                    { text: '低头', correct: false }
                                ]);
                            });
                        });
                        break;
                    case 'airway':
                        this.currentPhase = 'compression';
                        this.phaseText.setText('胸外按压');
                        this.pressingHint.setText('点击继续');
                        this.pressingHint.setVisible(true);
                        
                        // 添加过渡文本
                        const compressionTransitionText = this.add.text(400, window.innerHeight / 2 + 30, 
                            '气道已经开放，\n\n' +
                            '现在需要立即进行胸外按压，\n\n' +
                            '以维持患者血液循环。',
                            {
                                fontSize: '24px',
                                fill: '#FFFFFF',
                                fontFamily: 'Microsoft YaHei',
                                stroke: '#000000',
                                strokeThickness: 4,
                                align: 'center',
                                wordWrap: { width: 500 }
                            }
                        ).setOrigin(0.5, 0.5);
                        compressionTransitionText.setDepth(25);
                        
                        // 添加点击继续功能
                        this.input.once('pointerdown', () => {
                            compressionTransitionText.destroy();
                            this.phaseText.setText('胸外按压');
                            this.pressingHint.setText('点击此处进行按压');
                            this.pressingHint.setVisible(true);
                            this.compressionCount = 0;
                            this.countText.setText('按压次数: 0/30');
                        });
                        break;
                    case 'compression':
                        this.currentPhase = 'breath';
                        this.phaseText.setText('人工呼吸');
                        this.pressingHint.setText('点击继续');
                        this.pressingHint.setVisible(true);
                        
                        // 添加过渡文本
                        const breathTransitionText = this.add.text(400, window.innerHeight / 2 + 30, 
                            '30次胸外按压已完成，\n\n' +
                            '现在需要进行人工呼吸，\n\n' +
                            '以帮助患者恢复自主呼吸。',
                            {
                                fontSize: '24px',
                                fill: '#FFFFFF',
                                fontFamily: 'Microsoft YaHei',
                                stroke: '#000000',
                                strokeThickness: 4,
                                align: 'center',
                                wordWrap: { width: 500 }
                            }
                        ).setOrigin(0.5, 0.5);
                        breathTransitionText.setDepth(25);
                        
                        // 添加点击继续功能
                        this.input.once('pointerdown', () => {
                            breathTransitionText.destroy();
                            this.currentPhase = 'breath';
                            this.phaseText.setText('人工呼吸');
                            this.pressingHint.setText('点击此处进行人工呼吸');
                            this.pressingHint.setVisible(true);
                            this.breathCount = 0;
                            this.countText.setText('呼吸次数: 0/2');
                        });
                        break;
                    case 'breath':
                        // 显示患者苏醒场景
                        const successText = this.add.text(400, window.innerHeight / 2 + 30, 
                            '经过多轮次救治，\n\n' +
                            '患者逐渐恢复意识，\n\n' +
                            '救治成功！',
                            {
                                fontSize: '24px',
                                fill: '#FFFFFF',
                                fontFamily: 'Microsoft YaHei',
                                stroke: '#000000',
                                strokeThickness: 4,
                                align: 'center',
                                wordWrap: { width: 500 }
                            }
                        ).setOrigin(0.5, 0.5);
                        successText.setDepth(100); // 提高深度值到100
                        
                        // 添加患者苏醒动画
                        this.tweens.add({
                            targets: this.patient,
                            angle: 0,
                            duration: 1000,
                            ease: 'Bounce.easeOut',
                            onComplete: () => {
                                // 更新患者表情为正常
                                this.updateFacialExpression('normal');
                                
                                // 添加救护车场景
                                const ambulanceText = this.add.text(400, window.innerHeight / 2 + 200, 
                                    '救护车已经到达，\n\n' +
                                    '医护人员接手救治，\n\n' +
                                    '患者被送往医院。',
                                    {
                                        fontSize: '24px',
                                        fill: '#FFFFFF',
                                        fontFamily: 'Microsoft YaHei',
                                        stroke: '#000000',
                                        strokeThickness: 4,
                                        align: 'center',
                                        wordWrap: { width: 500 }
                                    }
                                ).setOrigin(0.5, 0.5);
                                ambulanceText.setDepth(100); // 提高深度值到100
                                
                                // 添加救护车动画
                                const ambulance = this.add.graphics();
                                ambulance.fillStyle(0xFF0000);
                                ambulance.fillRect(0, window.innerHeight / 2 - 50, 100, 50);
                                ambulance.setPosition(-100, 0);
                                ambulance.setDepth(99); // 设置深度为99，在文字下方
                                
                                this.tweens.add({
                                    targets: ambulance,
                                    x: window.innerWidth + 100,
                                    duration: 2000,
                                    ease: 'Power2',
                                    onComplete: () => {
                                        ambulance.destroy();
                                        ambulanceText.destroy();
                                        successText.destroy();
                                        this.gameOver();
                                    }
                                });
                            }
                        });
                        break;
                }
            });
        } else {
            // 播放错误音效
            AudioGenerator.generateError();
            
            // 显示错误效果
            this.showErrorEffect(pointer);
            
            // 完全禁用所有选项的交互
            this.optionsContainer.list.forEach(option => {
                if (option instanceof Phaser.GameObjects.Rectangle) {
                    option.disableInteractive();
                    option.setAlpha(0.5); // 降低透明度表示禁用状态
                }
            });
            
            // 移除所有选项的悬停效果
            this.optionsContainer.list.forEach(option => {
                if (option instanceof Phaser.GameObjects.Rectangle) {
                    option.removeAllListeners('pointerover');
                    option.removeAllListeners('pointerout');
                    option.removeAllListeners('pointerdown');
                }
            });
            
            // 创建灰色遮罩
            const overlay = this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000, 0.5);
            overlay.setOrigin(0, 0);
            overlay.setDepth(15);
            
            // 显示救治失败提示
            const failText = this.add.text(400, 100, 
                '救治失败！\n\n' +
                '错误的操作可能导致患者情况恶化。',
                {
                    fontSize: '24px',
                    fill: '#FF0000',
                    fontFamily: 'Microsoft YaHei',
                    stroke: '#000000',
                    strokeThickness: 4,
                    align: 'center',
                    wordWrap: { width: 500 }
                }
            ).setOrigin(0.5, 0);
            failText.setDepth(20);
            
            // 添加人物倒地动画
            this.tweens.add({
                targets: this.patient,
                angle: 90,
                y: window.innerHeight * 0.7,  // 设置落地位置
                duration: 1000,
                ease: 'Bounce.easeOut'
            });
            
            // 隐藏选项和其他UI元素
            this.optionsContainer.setAlpha(0);
            this.phaseText.setVisible(false);
            this.pressingHint.setVisible(false);
            this.rateText.setVisible(false);
            this.countText.setVisible(false);
            this.scoreText.setVisible(false);
            
            // 创建重新开始按钮
            const restartButton = this.add.rectangle(400, window.innerHeight - 100, 200, 60, 0xFF0000);
            restartButton.setInteractive();
            restartButton.setDepth(20);
            
            const restartText = this.add.text(400, window.innerHeight - 100, '重新开始', {
                fontSize: '24px',
                fill: '#FFFFFF',
                fontFamily: 'Microsoft YaHei',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5, 0.5);
            restartText.setDepth(20);
            
            // 添加按钮悬停效果
            restartButton.on('pointerover', () => {
                restartButton.setFillStyle(0xCC0000);
            });
            
            restartButton.on('pointerout', () => {
                restartButton.setFillStyle(0xFF0000);
            });
            
            // 添加按钮点击事件
            restartButton.on('pointerdown', () => {
                // 刷新页面重新开始
                window.location.reload();
            });
        }
    }

    checkAnswer(selectedOption) {
        return selectedOption.correct;
    }

    createPhase(phase) {
        this.currentPhase = phase;
        
        // 清理之前的动画
        if (this.pressAreaTween) {
            this.pressAreaTween.stop();
            this.pressAreaTween = null;
        }
        
        // 根据阶段设置UI和交互
        switch(phase) {
            case 'introduction':
                this.phaseText.setText('场景介绍');
                this.pressingHint.setText('点击继续');
                this.pressingHint.setVisible(true);
                
                // 创建背景介绍文本
                const introText = this.add.text(400, window.innerHeight / 2 + 30, 
                    '国网公司正在进行心肺复苏培训。\n\n' +
                    '现在模拟场景中出现人员晕倒情况。\n\n' +
                    '作为现场工作人员，请立即进行心肺复苏。',
                    {
                        fontSize: '24px',
                        fill: '#FFFFFF',
                        fontFamily: 'Microsoft YaHei',
                        stroke: '#000000',
                        strokeThickness: 4,
                        align: 'center',
                        wordWrap: { width: 500 }
                    }
                ).setOrigin(0.5, 0.5);
                introText.setDepth(20);
                
                // 添加点击继续功能
                this.input.once('pointerdown', () => {
                    introText.destroy();
                    
                    // 添加过渡文本
                    const transitionText = this.add.text(400, window.innerHeight / 2 + 30, 
                        '你迅速跑到患者身边，\n\n' +
                        '发现患者躺在地上，\n\n' +
                        '需要立即检查患者意识状态。',
                        {
                            fontSize: '24px',
                            fill: '#FFFFFF',
                            fontFamily: 'Microsoft YaHei',
                            stroke: '#000000',
                            strokeThickness: 4,
                            align: 'center',
                            wordWrap: { width: 500 }
                        }
                    ).setOrigin(0.5, 0.5);
                    transitionText.setDepth(20);
                    
                    // 添加点击继续功能
                    this.input.once('pointerdown', () => {
                        transitionText.destroy();
                        this.currentPhase = 'check';
                        this.phaseText.setText('检查意识');
                        this.pressingHint.setText('点击继续');
                        this.pressingHint.setVisible(true);
                        this.time.delayedCall(1000, () => {
                            this.showOptions('检查意识', [
                                { text: '轻拍肩膀，观察反应', correct: true },
                                { text: '用力摇晃', correct: false },
                                { text: '大声喊叫', correct: false }
                            ]);
                        });
                    });
                });
                break;
            case 'check':
                this.phaseText.setText('检查意识');
                this.pressingHint.setText('点击继续');
                this.pressingHint.setVisible(true);
                
                // 添加检查意识描述
                const checkText = this.add.text(400, window.innerHeight / 2, 
                    '检查意识是CPR的第一步，需要：\n\n' +
                    '1. 轻拍患者肩膀\n' +
                    '2. 大声呼唤患者\n' +
                    '3. 观察患者是否有反应\n\n' +
                    '如果患者没有反应，说明意识丧失，\n' +
                    '需要立即进行下一步救援。',
                    {
                        fontSize: '24px',
                        fill: '#FFFFFF',
                        fontFamily: 'Microsoft YaHei',
                        stroke: '#000000',
                        strokeThickness: 4,
                        align: 'center',
                        wordWrap: { width: 500 }
                    }
                ).setOrigin(0.5, 0.5);
                checkText.setDepth(25); // 提高深度值，确保显示在最上层
                
                // 添加点击继续功能
                this.input.once('pointerdown', () => {
                    checkText.destroy();
                    this.time.delayedCall(1000, () => {
                        this.showOptions('检查意识', [
                            { text: '轻拍肩膀，观察反应', correct: true },
                            { text: '用力摇晃', correct: false },
                            { text: '大声喊叫', correct: false }
                        ]);
                    });
                });
                break;
            case 'call':
                this.phaseText.setText('呼叫救援');
                this.pressingHint.setText('点击继续');
                this.pressingHint.setVisible(true);
                this.time.delayedCall(1000, () => {
                    this.showOptions('呼叫救援', [
                        { text: '大声呼救，拨打120', correct: true },
                        { text: '等待他人发现', correct: false },
                        { text: '先拍照发朋友圈', correct: false }
                    ]);
                });
                break;
            case 'airway':
                this.phaseText.setText('开放气道');
                this.pressingHint.setText('点击继续');
                this.pressingHint.setVisible(true);
                this.time.delayedCall(1000, () => {
                    this.showOptions('开放气道', [
                        { text: '仰头抬颌', correct: true },
                        { text: '侧头', correct: false },
                        { text: '低头', correct: false }
                    ]);
                });
                break;
            case 'compression':
                this.phaseText.setText('胸外按压');
                this.pressingHint.setText('点击此处进行按压');
                this.pressingHint.setVisible(true);
                this.compressionCount = 0;
                this.countText.setText('按压次数: 0/30');
                this.startCompression();
                break;
            case 'breath':
                this.phaseText.setText('人工呼吸');
                this.pressingHint.setText('点击此处进行人工呼吸');
                this.pressingHint.setVisible(true);
                this.breathCount = 0;
                this.countText.setText('呼吸次数: 0/2');
                break;
            case 'recovery':
                this.phaseText.setText('检查恢复');
                this.pressingHint.setVisible(false);
                // 创建检查恢复提示文本
                const recoveryText = this.add.text(
                    400,
                    window.innerHeight / 2 + 30,
                    '请检查患者是否恢复意识\n\n' +
                    '1. 观察患者呼吸\n\n' +
                    '2. 检查患者反应\n\n' +
                    '3. 评估患者状态',
                    {
                        fontSize: '24px',
                        fill: '#FFFFFF',
                        fontFamily: 'Microsoft YaHei',
                        stroke: '#000000',
                        strokeThickness: 4,
                        align: 'center',
                        wordWrap: { width: 500 }
                    }
                ).setOrigin(0.5, 0.5);
                recoveryText.setDepth(20);

                // 创建选项
                const options = [
                    { text: '检查患者情况，继续救治', correct: true },
                    { text: '停止救治，等待救护车', correct: false },
                    { text: '离开现场', correct: false }
                ];

                // 创建选项按钮
                options.forEach((option, index) => {
                    const button = this.add.rectangle(
                        window.innerWidth / 2,
                        window.innerHeight / 2 + 150 + index * 60,
                        300,
                        40,
                        0x666666
                    )
                    .setInteractive()
                    .setDepth(20);

                    const buttonText = this.add.text(
                        window.innerWidth / 2,
                        window.innerHeight / 2 + 150 + index * 60,
                        option.text,
                        {
                            fontSize: '20px',
                            fill: '#FFFFFF',
                            fontFamily: 'Microsoft YaHei'
                        }
                    )
                    .setOrigin(0.5, 0.5)
                    .setDepth(20);

                    button.on('pointerover', () => {
                        button.setFillStyle(0x888888);
                    });

                    button.on('pointerout', () => {
                        button.setFillStyle(0x666666);
                    });

                    button.on('pointerdown', () => {
                        this.sound.play('select');
                        
                        // 移除所有选项
                        options.forEach(opt => {
                            opt.button?.destroy();
                            opt.text?.destroy();
                        });
                        recoveryText.destroy();

                        if (option.correct) {
                            // 正确选择，进入结果展示
                            this.showResult();
                        } else {
                            // 错误选择，显示失败
                            this.showFailure();
                        }
                    });
                });
                break;
        }
        
        // 创建阶段特定的视觉元素
        this.createPhaseSpecificElements();
    }

    createTutorialButton() {
        // 创建教程按钮背景
        this.tutorialButton = this.add.rectangle(window.innerWidth - 150, 50, 200, 50, 0x2C3E50);
        this.tutorialButton.setInteractive();
        this.tutorialButton.setAlpha(0.8);
        this.tutorialButton.setDepth(15);
        
        // 创建教程按钮文本
        const tutorialText = this.add.text(window.innerWidth - 150, 50, '查看教程', {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontFamily: 'Microsoft YaHei',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5, 0.5);
        tutorialText.setDepth(15);
        // 添加悬停效果
        this.tutorialButton.on('pointerover', () => {
            this.tutorialButton.setFillStyle(0x34495E);
            this.tweens.add({
                targets: this.tutorialButton,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                ease: 'Power2'
            });
        });
        
        this.tutorialButton.on('pointerout', () => {
            this.tutorialButton.setFillStyle(0x2C3E50);
            this.tweens.add({
                targets: this.tutorialButton,
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: 'Power2'
            });
        });
        
        // 添加点击事件
        this.tutorialButton.on('pointerdown', () => {
            // 播放选择音效
            AudioGenerator.generateSelect();
            
            // 创建点击特效
            const clickEffect = this.add.circle(window.innerWidth - 150, 50, 0, 0xffffff, 0.5);
            
            this.tweens.add({
                targets: clickEffect,
                radius: 30,
                alpha: 0,
                duration: 300,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    clickEffect.destroy();
                }
            });
            
            // 显示教程
            this.showTutorial();
        });

        // 创建重新开始按钮背景
        this.restartButton = this.add.rectangle(window.innerWidth - 150, 120, 200, 50, 0xE74C3C);
        this.restartButton.setInteractive();
        this.restartButton.setAlpha(0.8);
        this.restartButton.setDepth(15);

        // 创建重新开始按钮文本
        const restartText = this.add.text(window.innerWidth - 150, 120, '重新开始', {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontFamily: 'Microsoft YaHei',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5, 0.5);
        restartText.setDepth(15);
        // 添加悬停效果
        this.restartButton.on('pointerover', () => {
            this.restartButton.setFillStyle(0xC0392B);
            this.tweens.add({
                targets: this.restartButton,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                ease: 'Power2'
            });
        });
        
        this.restartButton.on('pointerout', () => {
            this.restartButton.setFillStyle(0xE74C3C);
            this.tweens.add({
                targets: this.restartButton,
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: 'Power2'
            });
        });
        
        // 添加点击事件
        this.restartButton.on('pointerdown', () => {
            // 播放选择音效
            AudioGenerator.generateSelect();
            
            // 创建点击特效
            const clickEffect = this.add.circle(window.innerWidth - 150, 120, 0, 0xffffff, 0.5);
            
            this.tweens.add({
                targets: clickEffect,
                radius: 30,
                alpha: 0,
                duration: 300,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    clickEffect.destroy();
                    // 刷新页面
                    window.location.reload();
                }
            });
        });
    }

    // 人工呼吸完成
    completeBreathing() {
        // 移除所有提示文本
        this.breathingHint?.destroy();
        this.breathingCountText?.destroy();
        
        // 进入检查阶段
        this.checkPhase();
    }

    // 胸外按压阶段
    startCompression() {
        this.currentPhase = 'compression';
        this.compressionCount = 0;
        this.lastCompressionTime = 0;
        
        // 创建按压提示文本
        this.pressingHint = this.add.text(
            this.pressAreaPosition ? this.pressAreaPosition.x : window.innerWidth * 0.7,
            (this.pressAreaPosition ? this.pressAreaPosition.y : window.innerHeight / 2) - 50,
            '点击此处进行按压',
            {
                fontSize: '24px',
                fill: '#FFFFFF',
                fontFamily: 'Microsoft YaHei',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5, 0.5);
        this.pressingHint.setDepth(20);

        // 创建按压核心要点提示
        this.compressionTips = this.add.text(
            400,
            window.innerHeight / 2 + 30,
            '胸外按压核心要点：\n\n' +
            '1. 按压位置：胸骨下半部\n\n' +
            '2. 按压深度：5-6厘米\n\n' +
            '3. 按压频率：100-120次/分钟\n\n' +
            '4. 按压次数：30次',
            {
                fontSize: '24px',
                fill: '#FFFFFF',
                fontFamily: 'Microsoft YaHei',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center',
                wordWrap: { width: 500 }
            }
        ).setOrigin(0.5, 0.5);
        this.compressionTips.setDepth(20);

        // 创建按压次数文本
        this.countText = this.add.text(
            window.innerWidth / 2,
            50,
            '按压次数: 0/30',
            {
                fontSize: '24px',
                fill: '#FFFFFF',
                fontFamily: 'Microsoft YaHei',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5, 0.5);
        this.countText.setDepth(20);

        // 创建按压频率文本
        this.rateText = this.add.text(
            window.innerWidth / 2,
            100,
            '按压频率: 0 次/分钟',
            {
                fontSize: '24px',
                fill: '#FFFFFF',
                fontFamily: 'Microsoft YaHei',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5, 0.5);
        this.rateText.setDepth(20);

        // 确保音频上下文处于活动状态
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // 启动节拍器
        if (this.metronomeInterval) {
            clearInterval(this.metronomeInterval);
        }
        
        this.metronomeInterval = setInterval(() => {
            if (this.currentPhase === 'compression' && this.compressionCount < 30) {
                // 确保音频上下文处于活动状态
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                AudioGenerator.generateMetronome();
            }
        }, 500); // 120次/分钟
    }

    checkCompressionQuality() {
        // 确保音频上下文处于活动状态
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // 检查按压频率是否在100-120次/分钟之间
        if (this.compressionRate >= 100 && this.compressionRate <= 120) {
            // 按压频率正确
            AudioGenerator.generateSuccess();
            this.score += 10;
            this.scoreText.setText(`得分: ${this.score}`);
            this.showSuccessEffect();
        } else {
            // 按压频率不正确
            AudioGenerator.generateError();
            this.showErrorEffect();
        }
    }

    handleOptionClick(option, isCorrect) {
        // 禁用所有选项的点击
        this.optionGroup.getChildren().forEach(opt => {
            opt.setInteractive(false);
        });

        // 显示选项对错的颜色反馈
        this.optionGroup.getChildren().forEach(opt => {
            if (opt.text === option.text) {
                // 当前选项
                opt.setStyle({ fill: isCorrect ? '#00ff00' : '#ff0000' });
            } else if (opt.text === this.correctAnswer) {
                // 正确答案
                opt.setStyle({ fill: '#00ff00' });
            }
        });

        // 延迟执行后续操作，让用户有时间看到颜色反馈
        this.time.delayedCall(1000, () => {
            if (isCorrect) {
                // 播放成功音效
                AudioGenerator.generateSuccess();
                // 显示成功效果
                this.showSuccessEffect();
                // 增加分数
                this.score += 10;
                this.scoreText.setText(`得分: ${this.score}`);
                
                // 根据当前阶段进入下一阶段
                switch(this.currentPhase) {
                    case 'introduction':
                        this.currentPhase = 'check';
                        this.phaseText.setText('阶段: 检查意识');
                        this.createCheckOptions();
                        break;
                    case 'check':
                        this.currentPhase = 'call';
                        this.phaseText.setText('阶段: 呼叫救援');
                        this.createCallOptions();
                        break;
                    case 'call':
                        this.currentPhase = 'airway';
                        this.phaseText.setText('阶段: 开放气道');
                        this.createAirwayOptions();
                        break;
                    case 'airway':
                        this.currentPhase = 'compression';
                        this.phaseText.setText('阶段: 胸外按压');
                        this.createCompressionOptions();
                        break;
                    case 'compression':
                        this.currentPhase = 'breath';
                        this.phaseText.setText('阶段: 人工呼吸');
                        this.createBreathOptions();
                        break;
                    case 'breath':
                        this.currentPhase = 'recovery';
                        this.phaseText.setText('阶段: 检查恢复');
                        this.createRecoveryOptions();
                        break;
                }
            } else {
                // 播放错误音效
                AudioGenerator.generateError();
                // 显示错误效果
                this.showErrorEffect();
                // 减少分数
                this.score = Math.max(0, this.score - 5);
                this.scoreText.setText(`得分: ${this.score}`);
            }
        });
    }

    showOptions(phase, options) {
        // 清除现有选项
        this.optionsContainer.removeAll(true);
        
        // 设置选项容器位置和深度
        this.optionsContainer.setPosition(400, window.innerHeight / 2);
        this.optionsContainer.setAlpha(1);
        this.optionsContainer.setDepth(20); // 提高深度值，确保显示在最上层
        
        // 创建选项按钮
        options.forEach((option, index) => {
            const y = -30 + index * 100;
            
            // 添加情况说明文本
            const description = this.add.text(0, y - 30, this.getDescription(phase, index), {
                fontSize: '20px',
                fill: '#FFFFFF',
                fontFamily: 'Microsoft YaHei',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center',
                wordWrap: { width: 500 }
            }).setOrigin(0.5, 0.5);
            
            // 创建可点击区域
            const hitArea = this.add.rectangle(0, y, 600, 60, 0x3498db);  // 使用蓝色作为基础色
            hitArea.setOrigin(0.5, 0.5);
            hitArea.setInteractive();
            hitArea.setAlpha(0.9);
            
            // 添加选项文本
            const text = this.add.text(0, y, option.text, {
                fontSize: '24px',
                fill: '#FFFFFF',
                fontFamily: 'Microsoft YaHei',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5, 0.5);
            
            // 将按钮和文本添加到容器
            this.optionsContainer.add([description, hitArea, text]);
            
            // 添加点击事件
            hitArea.on('pointerdown', (pointer) => {
                this.handleOptionSelect(option, pointer);
            });
            
            // 添加悬停效果
            hitArea.on('pointerover', () => {
                hitArea.setFillStyle(0x2980b9);  // 悬停时使用深蓝色
            });
            
            hitArea.on('pointerout', () => {
                hitArea.setFillStyle(0x3498db);  // 恢复原来的蓝色
            });
        });
    }

    getDescription(phase, index) {
        switch(phase) {
            case 'check':
                switch(index) {
                    case 0: return '患者没有反应，需要轻拍肩膀并观察';
                    case 1: return '用力摇晃可能会加重患者伤';
                    case 2: return '大声喊叫可能会影响周围环境';
                    default: return '';
                }
            case 'call':
                switch(index) {
                    case 0: return '大声呼救可以吸引周围人的注意，拨打120是必要的';
                    case 1: return '等待他人发现会延误救援时间';
                    case 2: return '拍照发朋友圈会浪费宝贵的救援时间';
                    default: return '';
                }
            case 'airway':
                switch(index) {
                    case 0: return '仰头抬颌法可以保持气道通畅';
                    case 1: return '侧头法可能会影响气道开放';
                    case 2: return '低头法会阻塞气道';
                    default: return '';
                }
            default:
                return '';
        }
    }
} 
