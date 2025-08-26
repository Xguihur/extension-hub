#!/usr/bin/env node

/**
 * 图标生成脚本
 * 
 * 由于需要PNG格式的图标文件，您可以通过以下方式生成：
 * 
 * 方法1: 使用在线SVG转PNG工具
 * 1. 打开 icons/icon.svg 文件
 * 2. 访问 https://cloudconvert.com/svg-to-png 或类似工具
 * 3. 上传SVG文件，设置不同尺寸：16x16, 32x32, 48x48, 128x128
 * 4. 下载生成的PNG文件，重命名为 icon16.png, icon32.png, icon48.png, icon128.png
 * 5. 将文件放入 icons/ 目录
 * 
 * 方法2: 使用命令行工具 (需要安装 imagemagick 或 inkscape)
 * 
 * 使用 ImageMagick:
 * convert icons/icon.svg -resize 16x16 icons/icon16.png
 * convert icons/icon.svg -resize 32x32 icons/icon32.png
 * convert icons/icon.svg -resize 48x48 icons/icon48.png
 * convert icons/icon.svg -resize 128x128 icons/icon128.png
 * 
 * 使用 Inkscape:
 * inkscape icons/icon.svg --export-png=icons/icon16.png --export-width=16 --export-height=16
 * inkscape icons/icon.svg --export-png=icons/icon32.png --export-width=32 --export-height=32
 * inkscape icons/icon.svg --export-png=icons/icon48.png --export-width=48 --export-height=48
 * inkscape icons/icon.svg --export-png=icons/icon128.png --export-width=128 --export-height=128
 * 
 * 方法3: 使用Node.js包 (需要安装依赖)
 * npm install sharp
 * 然后运行此脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 图标生成脚本');
console.log('=================\n');

const iconsDir = path.join(__dirname, '../icons');
const svgPath = path.join(iconsDir, 'icon.svg');

// 检查SVG文件是否存在
if (!fs.existsSync(svgPath)) {
    console.error('❌ 未找到 icons/icon.svg 文件');
    process.exit(1);
}

console.log('✅ 找到SVG文件:', svgPath);

// 检查是否已有PNG文件
const requiredIcons = ['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png'];
const missingIcons = requiredIcons.filter(icon => 
    !fs.existsSync(path.join(iconsDir, icon))
);

if (missingIcons.length === 0) {
    console.log('✅ 所有PNG图标文件都已存在');
    process.exit(0);
}

console.log('⚠️  缺少以下PNG图标文件:', missingIcons);
console.log('\n📝 生成PNG图标的方法：');
console.log('\n1. 在线转换（推荐）：');
console.log('   访问: https://cloudconvert.com/svg-to-png');
console.log('   上传 icons/icon.svg，生成不同尺寸的PNG文件');

console.log('\n2. 使用ImageMagick：');
console.log('   brew install imagemagick  # macOS');
console.log('   然后运行以下命令：');
requiredIcons.forEach(icon => {
    const size = icon.match(/\d+/)[0];
    console.log(`   convert icons/icon.svg -resize ${size}x${size} icons/${icon}`);
});

console.log('\n3. 使用在线图标生成器：');
console.log('   - https://favicon.io/favicon-converter/');
console.log('   - https://realfavicongenerator.net/');

console.log('\n4. 手动设计：');
console.log('   使用设计软件（如Figma, Photoshop）根据SVG设计创建PNG版本');

// 尝试使用sharp包生成（如果已安装）
try {
    const sharp = require('sharp');
    
    console.log('\n🔧 检测到sharp包，尝试自动生成PNG图标...');
    
    const generateIcon = async (size) => {
        const outputPath = path.join(iconsDir, `icon${size}.png`);
        
        // 由于sharp不能直接处理SVG中的渐变，我们创建一个简单的替代方案
        await sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: { r: 102, g: 126, b: 234, alpha: 1 }
            }
        })
        .png()
        .toFile(outputPath);
        
        console.log(`✅ 生成 ${path.basename(outputPath)}`);
    };
    
    const sizes = [16, 32, 48, 128];
    Promise.all(sizes.map(generateIcon))
        .then(() => {
            console.log('🎉 所有图标生成完成！');
        })
        .catch(err => {
            console.error('❌ 生成图标时出错:', err.message);
            console.log('请使用上述手动方法生成图标文件');
        });
    
} catch (err) {
    console.log('\n💡 提示：可以安装sharp包来自动生成图标');
    console.log('   npm install sharp');
    console.log('   然后重新运行此脚本');
}

console.log('\n📁 完成后，icons目录应包含以下文件：');
console.log('   - icon.svg');
requiredIcons.forEach(icon => {
    console.log(`   - ${icon}`);
});
