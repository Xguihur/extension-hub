# 🚀 安装指南

## 快速开始

### 1. 开发模式安装（推荐）

1. **打开Chrome扩展管理页面**
   - 在Chrome地址栏输入：`chrome://extensions/`
   - 或者：菜单 → 更多工具 → 扩展程序

2. **启用开发者模式**
   - 在扩展管理页面右上角，打开"开发者模式"开关

3. **加载插件**
   - 点击"加载已解压的扩展程序"按钮
   - 选择 `web-data-collector` 文件夹
   - 插件会立即加载并显示在工具栏中

### 2. 验证安装

1. **检查插件图标**
   - 在Chrome工具栏右侧应该看到插件图标
   - 图标显示为蓝紫色渐变的数据收集图标

2. **测试基本功能**
   - 访问任意网页（如：抖音商城、淘宝等）
   - 点击插件图标打开弹出面板
   - 查看是否正确显示当前网站信息

## 📝 使用前准备

### 图标优化（可选）
当前使用的是占位符图标，建议使用以下方法创建更好的图标：

1. **在线转换（推荐）**
   ```
   访问：https://cloudconvert.com/svg-to-png
   上传 icons/icon.svg
   生成 16x16, 32x32, 48x48, 128x128 尺寸的PNG文件
   替换 icons/ 目录中对应的PNG文件
   ```

2. **使用ImageMagick**
   ```bash
   # 安装ImageMagick
   brew install imagemagick  # macOS
   # 或
   sudo apt-get install imagemagick  # Linux
   
   # 生成图标
   cd web-data-collector
   convert icons/icon.svg -resize 16x16 icons/icon16.png
   convert icons/icon.svg -resize 32x32 icons/icon32.png
   convert icons/icon.svg -resize 48x48 icons/icon48.png
   convert icons/icon.svg -resize 128x128 icons/icon128.png
   ```

3. **使用生成脚本**
   ```bash
   # 安装sharp包（可选）
   npm install sharp
   
   # 运行生成脚本
   node scripts/generate-icons.js
   ```

## 🔧 开发环境设置

### 1. 开启开发者工具
```bash
# 在项目目录下
npm run dev  # 显示开发提示
```

### 2. 调试说明
- **Popup调试**：右键插件图标 → "检查弹出内容"
- **Content Script调试**：在网页中按F12，查看Console标签
- **Background Script调试**：在chrome://extensions/页面点击插件的"检查视图"

### 3. 重新加载插件
当修改代码后：
1. 在chrome://extensions/页面找到插件
2. 点击"重新加载"按钮（🔄）
3. 或者按Ctrl+R（Cmd+R）刷新页面

## 🌐 支持的网站

### ✅ 已完全支持
- **抖音商城** (douyin.com, dy.com)
  - 商品详情页
  - 商品列表页  
  - 直播间页面

- **淘宝/天猫** (taobao.com, tmall.com)
  - 商品详情页
  - 搜索结果页

- **京东** (jd.com, 360buy.com)
  - 商品详情页
  - 搜索结果页

### ⚙️ 通用支持
- 任何网站都可以使用"自定义模板"收集基础信息
- 页面标题、链接、图片等通用数据

## ❗ 常见问题

### Q: 插件无法收集数据？
**A:** 
1. 确认当前网站是否在支持列表中
2. 检查content script是否正确注入（F12查看Console）
3. 尝试刷新页面后重新收集

### Q: 显示"未连接"状态？
**A:**
1. 刷新当前网页
2. 重新加载插件
3. 检查是否有JavaScript错误

### Q: 数据收集不完整？
**A:**
1. 网站页面可能还未完全加载
2. 网站结构可能发生变化
3. 可以尝试使用"自定义模板"

### Q: 如何卸载插件？
**A:**
1. 进入chrome://extensions/
2. 找到"网页数据收集器"
3. 点击"移除"按钮

## 📞 获取帮助

如果遇到问题：
1. 查看浏览器控制台的错误信息
2. 检查README.md中的详细文档
3. 提交Issue到项目仓库

---

🎉 **安装完成！开始收集网页数据吧！**
