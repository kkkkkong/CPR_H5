# CPR训练游戏

基于AHA（美国心脏协会）指南开发的CPR（心肺复苏）训练H5游戏。

## 功能特点

- 完整的CPR流程模拟
- 实时按压深度和频率反馈
- 节拍器引导
- 多语言支持
- 移动端适配

## 安装说明

0. 首先确保安装了Node，安装包在根目录下的“node-v22.14.0-x64.msi”

1. 克隆项目
```bash
git clone [项目地址]
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm start
```

4. 构建生产版本
```bash
npm run build
```

## 技术栈

- Phaser.js
- Howler.js
- Webpack
- HTML5/CSS3

## 项目结构

```
src/
  ├── assets/        # 游戏资源文件
  ├── styles/        # 样式文件
  ├── scenes/        # 游戏场景
  ├── index.js       # 游戏入口
  └── index.html     # HTML模板
```

## 开发规范

- 遵循AHA 2020年CPR指南
- 使用ES6+语法
- 保持代码注释完整
- 遵循移动端优先原则

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License 