# 🛠️ XPath选择器指南

## 🔄 从CSS选择器到XPath的改进

我已经将插件的元素选择器从CSS选择器全面升级为XPath表达式，带来了更强大的数据提取能力。

## ✨ XPath的优势

### 1. 更强的文本内容匹配
```javascript
// CSS选择器：只能通过类名或ID选择
'.price-current'

// XPath：可以通过文本内容直接匹配
'//*[contains(text(), "¥")]'
'//*[contains(text(), "已售")]'
```

### 2. 灵活的层级关系
```javascript
// XPath：可以查找包含特定文本的元素的兄弟元素
'//*[contains(text(), "原价")]/following-sibling::*[contains(text(), "¥")]'
'//*[contains(text(), "销量")]/following-sibling::*[text()]'
```

### 3. 复杂的逻辑条件
```javascript
// XPath：支持AND、OR等逻辑运算
'//*[contains(@class, "sell") and contains(@class, "count")]'
'//a[contains(@href, "shop") or contains(@href, "store")][text()]'
```

## 📊 各字段的XPath策略

### 商品标题
```javascript
[
    '//div[contains(@class, "tb-detail-hd")]//h1',     // 通过父容器定位
    '//*[@id="J_Title"]//h1',                          // 通过ID定位
    '//*[contains(@class, "ItemTitle--title--")]',     // 通过类名定位
    '//h1[text()]'                                     // 任何有文本的h1
]
```

### 价格信息 
```javascript
[
    '//*[contains(@class, "tb-rmb-num")][text()]',     // 有文本内容的价格元素
    '//*[contains(text(), "¥")]',                      // 包含人民币符号的文本
    '//*[contains(text(), "￥")]'                      // 包含全角人民币符号
]
```

### 销量数据
```javascript
[
    '//*[contains(text(), "已售")]',                   // 通过"已售"文本定位
    '//*[contains(text(), "成交")]',                   // 通过"成交"文本定位
    '//*[contains(text(), "销量")]/following-sibling::*[text()]'  // 查找销量标签的兄弟元素
]
```

### 店铺名称
```javascript
[
    '//*[contains(@class, "tb-shop-name")]//a',        // 店铺名称链接
    '//a[contains(@href, "shop") or contains(@href, "store")][text()]'  // 包含shop链接的文本
]
```

## 🔧 工具方法

### getElementByXPath
```javascript
getElementByXPath(xpath) {
    const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    );
    return result.singleNodeValue;
}
```

### getElementsByXPath
```javascript
getElementsByXPath(xpath) {
    const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null
    );
    // 返回所有匹配的元素数组
}
```

## 🎯 XPath表达式示例

### 基础语法
- `//div` - 选择所有div元素
- `//*` - 选择所有元素
- `//*[@class="price"]` - 选择class为"price"的元素
- `//*[contains(@class, "price")]` - 选择class包含"price"的元素

### 文本匹配
- `//*[text()="价格"]` - 文本完全匹配"价格"
- `//*[contains(text(), "价格")]` - 文本包含"价格"
- `//*[text()[contains(., "¥")]]` - 文本内容包含"¥"

### 轴操作
- `//div/following-sibling::*` - 选择div的后续兄弟元素
- `//span/parent::*` - 选择span的父元素
- `//a/ancestor::div` - 选择a元素的div祖先

### 逻辑运算
- `//*[@id="price" and @class="current"]` - 同时满足两个条件
- `//*[@class="price" or @class="cost"]` - 满足任一条件

## 🚀 性能优化

### 1. 具体化路径
```javascript
// 好：具体的路径
'//div[contains(@class, "product")]//span[contains(@class, "price")]'

// 避免：过于宽泛的查询
'//*[contains(text(), "¥")]'  // 可能匹配太多元素
```

### 2. 使用索引
```javascript
// 选择第一个匹配的元素
'(//div[contains(@class, "price")])[1]'
```

### 3. 缓存查询结果
```javascript
// 避免重复查询同一个XPath
const priceElement = this.getElementByXPath('//div[@class="price"]');
```

## 🐛 调试技巧

### 1. 浏览器控制台测试
```javascript
// 在浏览器控制台中测试XPath
$x('//div[contains(@class, "price")]')  // Chrome DevTools
```

### 2. 逐步简化
```javascript
// 如果复杂XPath不工作，逐步简化测试
'//*[contains(@class, "tm-price-panel")]//*[contains(@class, "tm-price")]'
// 简化为：
'//*[contains(@class, "tm-price")]'
```

### 3. 错误处理
```javascript
try {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
} catch (error) {
    console.warn('XPath查询失败:', xpath, error);
    return null;
}
```

## 📈 相比CSS选择器的改进

| 功能 | CSS选择器 | XPath | 改进说明 |
|------|-----------|--------|----------|
| 文本匹配 | ❌ | ✅ | 可以直接通过文本内容选择元素 |
| 向上查找 | ❌ | ✅ | 可以查找父元素、祖先元素 |
| 兄弟元素 | 有限 | ✅ | 强大的轴操作支持 |
| 逻辑运算 | 有限 | ✅ | 支持AND、OR等复杂条件 |
| 位置索引 | 有限 | ✅ | 灵活的位置选择 |

## 🎉 总结

通过使用XPath：
1. **更准确**：可以通过文本内容直接定位元素
2. **更灵活**：支持复杂的层级关系和逻辑条件
3. **更强大**：处理动态页面结构变化的能力更强
4. **更稳定**：减少对CSS类名变化的依赖

这次升级使插件具有更强的适应性和准确性！🚀
