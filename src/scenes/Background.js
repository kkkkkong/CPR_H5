export class Background {
    constructor(scene) {
        this.scene = scene;
        this.create();
    }

    create() {
        // 创建渐变背景
        const gradient = this.scene.add.graphics();
        gradient.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x4A90E2, 0x4A90E2);
        gradient.fillRect(0, 0, window.innerWidth, window.innerHeight);
        
        // 添加地面
        const ground = this.scene.add.rectangle(0, window.innerHeight - 100, window.innerWidth, 100, 0x228B22);
        
        // 添加草地纹理
        const grass = this.scene.add.graphics();
        grass.lineStyle(2, 0x1B5E20);
        
        // 增加草地密度
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * window.innerWidth;
            const y = window.innerHeight - 100 + Math.random() * 100;
            const height = 10 + Math.random() * 30;
            const angle = -10 + Math.random() * 20;
            
            // 计算旋转后的终点坐标
            const rad = angle * Math.PI / 180;
            const endX = x + Math.sin(rad) * height;
            const endY = y - Math.cos(rad) * height;
            
            grass.moveTo(x, y);
            grass.lineTo(endX, endY);
        }
        
        // 添加草地阴影
        const grassShadow = this.scene.add.graphics();
        grassShadow.lineStyle(1, 0x1B5E20, 0.3);
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * window.innerWidth;
            const y = window.innerHeight - 100 + Math.random() * 100;
            const length = 5 + Math.random() * 10;
            
            grassShadow.moveTo(x, y);
            grassShadow.lineTo(x + length, y);
        }
        
        // 添加草地装饰
        const grassDecor = this.scene.add.graphics();
        // 添加小花朵
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * window.innerWidth;
            const y = window.innerHeight - 100 + Math.random() * 100;
            
            // 花瓣
            grassDecor.fillStyle(0xFF69B4, 0.8);
            for (let j = 0; j < 4; j++) {
                const angle = (j / 4) * Math.PI * 2;
                grassDecor.fillCircle(
                    x + Math.cos(angle) * 3,
                    y + Math.sin(angle) * 3,
                    2
                );
            }
            // 花心
            grassDecor.fillStyle(0xFFFF00, 0.8);
            grassDecor.fillCircle(x, y, 1);
        }
        
        // 添加小石头
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * window.innerWidth;
            const y = window.innerHeight - 100 + Math.random() * 100;
            const size = 2 + Math.random() * 4;
            
            grassDecor.fillStyle(0x808080, 0.8);
            grassDecor.fillCircle(x, y, size);
        }
        
        // 添加草地纹理
        const grassTexture = this.scene.add.graphics();
        grassTexture.fillStyle(0x1B5E20, 0.1);
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * window.innerWidth;
            const y = window.innerHeight - 100 + Math.random() * 100;
            const size = 5 + Math.random() * 10;
            
            grassTexture.fillCircle(x, y, size);
        }
        
        // 添加草地边缘渐变
        const grassEdge = this.scene.add.graphics();
        grassEdge.fillGradientStyle(0x228B22, 0x228B22, 0x1B5E20, 0x1B5E20);
        grassEdge.fillRect(0, window.innerHeight - 100, window.innerWidth, 20);
        
        // 添加装饰性云朵
        for (let i = 0; i < 5; i++) {
            const cloud = this.scene.add.graphics();
            cloud.fillStyle(0xFFFFFF, 0.8);
            
            // 创建多层云朵
            for (let j = 0; j < 3; j++) {
                cloud.fillCircle(
                    100 + i * 150 + j * 20,
                    100 + i * 50,
                    20 + j * 5
                );
            }
            
            // 添加云朵移动动画
            this.scene.tweens.add({
                targets: cloud,
                x: cloud.x + 50,
                duration: 3000 + i * 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 添加背景粒子效果
        for (let i = 0; i < 50; i++) {
            const particle = this.scene.add.circle(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight,
                2,
                0xFFFFFF
            );
            particle.setAlpha(0.3);
            
            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 100,
                alpha: 0,
                duration: 2000 + Math.random() * 2000,
                ease: 'Linear',
                onComplete: () => {
                    particle.setPosition(
                        Math.random() * window.innerWidth,
                        window.innerHeight
                    );
                    particle.setAlpha(0.3);
                },
                repeat: -1
            });
        }

        // 添加装饰性树木
        for (let i = 0; i < 3; i++) {
            const tree = this.scene.add.graphics();
            // 树干
            tree.fillStyle(0x8B4513);
            tree.fillRect(100 + i * 200, window.innerHeight - 150, 20, 50);
            // 树冠
            tree.fillStyle(0x228B22);
            tree.fillTriangle(
                90 + i * 200, window.innerHeight - 150,
                110 + i * 200, window.innerHeight - 150,
                100 + i * 200, window.innerHeight - 200
            );
        }

        // 添加装饰性花朵
        for (let i = 0; i < 20; i++) {
            const flower = this.scene.add.graphics();
            const x = Math.random() * window.innerWidth;
            const y = window.innerHeight - 100 + Math.random() * 50;
            
            // 花瓣
            flower.fillStyle(0xFF69B4);
            for (let j = 0; j < 5; j++) {
                const angle = (j / 5) * Math.PI * 2;
                flower.fillCircle(
                    x + Math.cos(angle) * 5,
                    y + Math.sin(angle) * 5,
                    3
                );
            }
            // 花心
            flower.fillStyle(0xFFFF00);
            flower.fillCircle(x, y, 2);
        }

        // 添加装饰性蝴蝶
        for (let i = 0; i < 3; i++) {
            const butterfly = this.scene.add.graphics();
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * (window.innerHeight / 2);
            
            // 蝴蝶翅膀
            butterfly.fillStyle(0xFFD700);
            butterfly.fillEllipse(x, y, 20, 10);
            
            // 添加蝴蝶飞舞动画
            this.scene.tweens.add({
                targets: butterfly,
                x: butterfly.x + 50,
                y: butterfly.y + Math.sin(butterfly.x / 50) * 20,
                duration: 2000 + i * 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 添加装饰性小鸟
        for (let i = 0; i < 2; i++) {
            const bird = this.scene.add.graphics();
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * (window.innerHeight / 3);
            
            // 小鸟身体
            bird.fillStyle(0x000000);
            bird.fillEllipse(x, y, 15, 8);
            
            // 小鸟翅膀
            bird.fillStyle(0x000000);
            bird.fillTriangle(
                x - 5, y,
                x + 5, y,
                x, y - 5
            );
            
            // 添加小鸟飞行动画
            this.scene.tweens.add({
                targets: bird,
                x: bird.x + 100,
                y: bird.y + Math.sin(bird.x / 50) * 10,
                duration: 3000 + i * 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
} 