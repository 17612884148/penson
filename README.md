# 多功能在线工具箱网站

一个功能丰富的在线工具集合网站，提供多媒体处理、文件处理、编码解码、文本处理、计算转换等多种实用工具。

## 项目特点

- **现代化UI设计**：采用Bootstrap 5构建，响应式布局适配各种设备
- **多种实用工具**：涵盖日常所需的多种在线工具
- **本地处理**：大部分工具在浏览器本地处理，保护用户隐私
- **暗黑模式**：支持明亮/暗黑主题切换，保护视力
- **零依赖部署**：可以静态部署，无需后端服务器

## 工具分类

本网站共包含以下几类工具：

1. **多媒体处理**
   - 音频处理：格式转换、剪辑合并、效果处理等
   - 视频处理：格式转换、压缩、剪辑、提取音频等
   - 图像处理：格式转换、压缩、编辑、背景移除等

2. **文件处理**
   - 文件格式转换
   - 在线压缩/解压
   - PDF处理
   - OCR文字识别等

3. **编码/解码工具**
   - 二维码/条码生成与识别
   - Base64编码/解码
   - URL编码/解码
   - 哈希计算等

4. **文本处理**
   - 文本格式化
   - 代码格式化
   - 正则表达式测试
   - Markdown编辑器等

5. **计算与转换**
   - 单位换算
   - 货币转换
   - 日期/时间计算
   - 颜色选择器等

6. **数据分析工具**
   - 数据可视化
   - 统计分析
   - 图表生成器等

7. **开发者工具**
   - JSON/XML/HTML格式化
   - CSS/JS压缩美化
   - API测试工具等

8. **生活工具**
   - BMI计算器
   - 任务清单
   - 天气预报等

## 项目结构

```
/
├── index.html          # 首页
├── css/
│   └── style.css       # 全局样式
├── js/
│   └── main.js         # 全局脚本
└── tools/              # 各工具页面
    ├── image-compress.html
    ├── audio-converter.html
    └── ...
```

## 如何运行

本项目是纯前端静态网站，可以通过以下方式运行：

1. **本地运行**：
   - 下载或克隆项目到本地
   - 使用任意Web服务器提供服务，如：
     - Python: `python -m http.server`
     - Node.js: `npx serve`
     - PHP: `php -S localhost:8000`

2. **在线部署**：
   - 部署到任意静态网站托管服务，如GitHub Pages、Netlify、Vercel等

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)
- Bootstrap 5
- 各种开源JS库（处理特定功能）

## 浏览器兼容性

支持所有现代浏览器，包括：
- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

不支持IE浏览器。

## 贡献指南

欢迎贡献新工具或改进现有功能！请按以下步骤：

1. Fork本仓库
2. 创建功能分支: `git checkout -b feature/amazing-tool`
3. 提交更改: `git commit -m 'Add some amazing tool'`
4. 推送分支: `git push origin feature/amazing-tool`
5. 提交Pull Request

## 许可证

本项目采用MIT许可证 - 详情请见LICENSE文件 

http://localhost:8080/tools/weather-forecast.html 