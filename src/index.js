import 'phaser';
import './styles/main.css';
import CPRScene from './scenes/CPRScene';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game-container',
        width: '100%',
        height: '100%',
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: CPRScene
};

const game = new Phaser.Game(config);

function preload() {
    // 加载游戏资源
    this.load.image('background', 'assets/background.png');
    this.load.image('patient', 'assets/patient.png');
    this.load.image('hands', 'assets/hands.png');
    this.load.audio('metronome', 'assets/metronome.mp3');
    this.load.audio('success', 'assets/success.mp3');
    this.load.audio('error', 'assets/error.mp3');
}

function create() {
    // 创建游戏场景
    this.add.image(400, 300, 'background');
    
    // 添加患者模型
    const patient = this.add.image(400, 300, 'patient');
    
    // 添加按压提示区域
    const pressArea = this.add.rectangle(400, 300, 100, 100, 0xffffff, 0.3);
    pressArea.setInteractive();
    
    // 添加按压计数器
    this.compressionCount = 0;
    this.compressionText = this.add.text(16, 16, '按压次数: 0', { 
        fontSize: '32px', 
        fill: '#fff' 
    });
    
    // 添加节拍器
    this.metronome = this.sound.add('metronome');
    this.metronome.setLoop(true);
    this.metronome.setVolume(0.5);
    
    // 设置按压事件
    pressArea.on('pointerdown', () => {
        this.compressionCount++;
        this.compressionText.setText('按压次数: ' + this.compressionCount);
        
        // 播放按压音效
        this.sound.play('metronome');
    });
}

function update() {
    // 游戏循环更新逻辑
} 