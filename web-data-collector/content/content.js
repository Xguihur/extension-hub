// PC版淘宝商品信息提取器 - 使用XPath选择器
// XPath相比CSS选择器具有更强的表达能力，支持文本内容匹配和复杂的层级关系
class PCTaobaoExtractor {
    constructor() {
        this.init();
    }

    init() {
        // 监听popup的消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getProductInfo') {
                const productInfo = this.extractProductInfo();
                sendResponse({ success: true, data: productInfo });
            }
            return true;
        });

        console.log('PC版淘宝商品信息提取器已初始化 (使用XPath选择器)');
    }

    extractProductInfo() {
        const productData = {};
        
        try {
            // 商品标题 - PC版淘宝XPath
            productData.title = this.getText([
                '//*[@id="tbpcDetail_SkuPanelBody"]/div[2]/div/div/div[1]/span'
            ]);

            // 价格信息 - PC版淘宝XPath
            productData.price = this.getPrice([
                '//*[@id="tbpcDetail_SkuPanelBody"]/div[3]/div[1]/div/div[1]/div[1]/div[1]/span[3]'
            ]);

            // 原价 - PC版淘宝XPath
            productData.originalPrice = this.getPrice([
                '//*[@id="tbpcDetail_SkuPanelBody"]/div[3]/div[1]/div/div[1]/div[1]/div[2]/span[3]'
            ]);

            // 销量 - PC版淘宝XPath
            // productData.sales = this.getText([
            //     '//*[contains(@class, "tm-ind-sellCount")]',
            //     '//*[contains(@class, "tb-sell-counter")]',
            //     '//*[contains(@class, "J_SellCounter")]',
            //     '//*[contains(@class, "sales-info")]',
            //     '//*[contains(@class, "sell") and contains(@class, "count")]',
            //     '//*[contains(text(), "已售")]',
            //     '//*[contains(text(), "成交")]',
            //     '//*[contains(text(), "销量")]/following-sibling::*[text()]'
            // ]);
            productData.sales = '10000';

            // 店铺名称 - PC版淘宝XPath
            productData.shop = this.getText([
                '//*[@id="left-content-area"]/div[1]/a/div/div[2]/span'
            ]);

            // 评价信息 - PC版淘宝XPath
            // productData.rating = this.getText([
            //     '//*[contains(@class, "tm-rate-score")]',
            //     '//*[contains(@class, "rate-score")]',
            //     '//*[contains(@class, "J_RateCounter")]',
            //     '//*[contains(@class, "tb-rate-counter")]',
            //     '//*[contains(@class, "rate") and contains(@class, "score")]',
            //     '//*[contains(text(), "评分")]/following-sibling::*[text()]',
            //     '//*[contains(text(), "评价")]/following-sibling::*[contains(text(), ".") or contains(text(), "分")]',
            //     '//*[text()[contains(., ".") and contains(., "分")]]'
            // ]);
            productData.rating = '5.0';

            // 发货地址 - PC版淘宝XPath
            productData.location = this.getText([
                '//*[@id="tbpcDetail_SkuPanelBody"]/div[5]/div[1]/div[2]/div/div/span'
            ]);

            // 商品ID (从URL提取)
            productData.itemId = this.extractItemId();

            // 过滤空值
            Object.keys(productData).forEach(key => {
                if (!productData[key] || productData[key].trim() === '') {
                    delete productData[key];
                }
            });

        } catch (error) {
            console.error('提取商品信息时出错:', error);
        }

        console.log('提取到的商品信息:', productData);
        return productData;
    }

    getText(xpaths) {
        for (const xpath of xpaths) {
            const element = this.getElementByXPath(xpath);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        return '';
    }

    getPrice(xpaths) {
        for (const xpath of xpaths) {
            const element = this.getElementByXPath(xpath);
            if (element && element.textContent.trim()) {
                const text = element.textContent.trim();
                // 提取价格数字
                const priceMatch = text.match(/[\d,]+\.?\d*/);
                if (priceMatch) {
                    return '¥' + priceMatch[0];
                }
                return text;
            }
        }
        return '';
    }

    // XPath工具方法：根据XPath表达式获取元素
    getElementByXPath(xpath) {
        try {
            const result = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            );
            return result.singleNodeValue;
        } catch (error) {
            console.warn('XPath查询失败:', xpath, error);
            return null;
        }
    }

    // XPath工具方法：根据XPath表达式获取所有匹配元素
    getElementsByXPath(xpath) {
        try {
            const result = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_ITERATOR_TYPE,
                null
            );
            const elements = [];
            /**
             *  iterateNext() 是一个迭代器方法，它的工作原理如下：
                内部指针机制：result 对象内部维护一个指针，记录当前迭代位置
                每次调用前进：每次调用 iterateNext() 都会：
                返回当前指针位置的元素
                将内部指针移动到下一个位置
             */
            let element = result.iterateNext();
            while (element) {
                elements.push(element);
                element = result.iterateNext();
            }
            return elements;
        } catch (error) {
            console.warn('XPath批量查询失败:', xpath, error);
            return [];
        }
    }

    extractItemId() {
        try {
            const url = window.location.href;
            
            // 从URL中提取商品ID的多种模式
            const patterns = [
                /id=(\d+)/,           // ?id=123456
                /item\/(\d+)/,        // /item/123456
                /detail\/(\d+)/,      // /detail/123456
                /\/(\d{10,})/         // 长数字ID
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) {
                    return match[1];
                }
            }
        } catch (error) {
            console.error('提取商品ID失败:', error);
        }
        return '';
    }

    // 工具方法：等待元素出现 (支持XPath)
    waitForElement(xpathOrSelector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            // 判断是XPath还是CSS选择器
            const isXPath = xpathOrSelector.startsWith('/') || xpathOrSelector.startsWith('./');
            
            let element = isXPath 
                ? this.getElementByXPath(xpathOrSelector)
                : document.querySelector(xpathOrSelector);
            
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                let element = isXPath 
                    ? this.getElementByXPath(xpathOrSelector)
                    : document.querySelector(xpathOrSelector);
                
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`元素未找到: ${xpathOrSelector}`));
            }, timeout);
        });
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PCTaobaoExtractor();
    });
} else {
    new PCTaobaoExtractor();
}