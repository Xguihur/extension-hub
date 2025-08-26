// content.js - 注入到网页中的内容脚本

class DataCollector {
    constructor() {
        this.templates = {
            'douyin': new DouyinTemplate(),
            'taobao': new TaobaoTemplate(), 
            'jd': new JDTemplate(),
            'custom': new CustomTemplate()
        };
        
        this.init();
    }

    init() {
        // 监听来自popup的消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // 保持消息通道开启
        });

        console.log('DataCollector initialized on:', window.location.href);
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'ping':
                    sendResponse({ success: true, status: 'connected' });
                    break;
                    
                case 'collectData':
                    const data = await this.collectData(request.template);
                    sendResponse({ success: true, data: data });
                    break;
                    
                default:
                    sendResponse({ success: false, error: '未知的操作类型' });
            }
        } catch (error) {
            console.error('处理消息时出错:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async collectData(templateName) {
        if (!templateName) {
            throw new Error('未指定数据收集模板');
        }

        const template = this.templates[templateName];
        if (!template) {
            throw new Error(`未找到模板: ${templateName}`);
        }

        console.log(`开始使用模板 ${templateName} 收集数据...`);
        
        // 等待页面加载完成
        await this.waitForPageLoad();
        
        // 使用对应模板收集数据
        const data = await template.collect();
        
        console.log('收集到的数据:', data);
        return data;
    }

    async waitForPageLoad() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve, { once: true });
            }
        });
    }

    // 通用的工具方法
    static getElementText(element) {
        if (!element) return '';
        return element.textContent?.trim() || '';
    }

    static getElementAttribute(element, attribute) {
        if (!element) return '';
        return element.getAttribute(attribute) || '';
    }

    static getAllElementsText(elements) {
        return Array.from(elements).map(el => this.getElementText(el));
    }

    static getPrice(priceText) {
        if (!priceText) return '';
        const price = priceText.match(/[\d,]+\.?\d*/);
        return price ? price[0] : priceText;
    }

    static waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
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
                reject(new Error(`元素未找到: ${selector}`));
            }, timeout);
        });
    }
}

// 抖音商城数据收集模板
class DouyinTemplate {
    async collect() {
        try {
            const data = [];
            
            // 商品详情页
            if (this.isProductPage()) {
                const productData = await this.collectProductData();
                if (productData) data.push(productData);
            }
            
            // 商品列表页
            else if (this.isListPage()) {
                const listData = await this.collectListData();
                data.push(...listData);
            }
            
            // 直播间
            else if (this.isLivePage()) {
                const liveData = await this.collectLiveData();
                data.push(...liveData);
            }
            
            return data;
        } catch (error) {
            console.error('抖音数据收集失败:', error);
            throw error;
        }
    }

    isProductPage() {
        return window.location.href.includes('product') || 
               window.location.href.includes('goods') ||
               document.querySelector('[data-testid="product-info"]') ||
               document.querySelector('.product-info');
    }

    isListPage() {
        return document.querySelectorAll('.product-item, [data-testid="product-item"]').length > 0;
    }

    isLivePage() {
        return window.location.href.includes('live') ||
               document.querySelector('.live-room, [data-testid="live-room"]');
    }

    async collectProductData() {
        const selectors = {
            title: [
                '[data-testid="product-title"]',
                '.product-title',
                'h1[class*="title"]',
                '.goods-title',
                'h1'
            ].join(','),
            
            price: [
                '[data-testid="product-price"]',
                '.product-price',
                '[class*="price"]:not([class*="original"])',
                '.current-price'
            ].join(','),
            
            originalPrice: [
                '[data-testid="original-price"]',
                '.original-price',
                '[class*="original-price"]'
            ].join(','),
            
            image: [
                '[data-testid="product-image"] img',
                '.product-image img',
                '.goods-image img',
                '.main-image img'
            ].join(','),
            
            description: [
                '[data-testid="product-description"]',
                '.product-description',
                '.goods-description'
            ].join(','),
            
            seller: [
                '[data-testid="seller-name"]',
                '.seller-name',
                '.shop-name'
            ].join(',')
        };

        const product = {
            title: '抖音商品',
            url: window.location.href,
            timestamp: new Date().toISOString()
        };

        // 收集各个字段
        Object.entries(selectors).forEach(([key, selector]) => {
            const element = document.querySelector(selector);
            if (element) {
                if (key === 'image') {
                    product[key] = DataCollector.getElementAttribute(element, 'src');
                } else if (key.includes('price')) {
                    product[key] = DataCollector.getPrice(DataCollector.getElementText(element));
                } else {
                    product[key] = DataCollector.getElementText(element);
                }
            }
        });

        return Object.keys(product).length > 3 ? product : null;
    }

    async collectListData() {
        const items = document.querySelectorAll('.product-item, [data-testid="product-item"], .goods-item');
        const data = [];

        items.forEach((item, index) => {
            if (index >= 20) return; // 限制数量

            const productData = {
                title: '商品列表项 ' + (index + 1),
                name: DataCollector.getElementText(item.querySelector('.product-name, .goods-name, [class*="title"]')),
                price: DataCollector.getPrice(DataCollector.getElementText(item.querySelector('[class*="price"]'))),
                image: DataCollector.getElementAttribute(item.querySelector('img'), 'src'),
                url: DataCollector.getElementAttribute(item.querySelector('a'), 'href') || window.location.href
            };

            if (productData.name || productData.price) {
                data.push(productData);
            }
        });

        return data;
    }

    async collectLiveData() {
        return [{
            title: '直播间信息',
            roomTitle: DataCollector.getElementText(document.querySelector('.live-title, [data-testid="live-title"]')),
            host: DataCollector.getElementText(document.querySelector('.host-name, [data-testid="host-name"]')),
            viewers: DataCollector.getElementText(document.querySelector('.viewer-count, [data-testid="viewer-count"]')),
            url: window.location.href
        }];
    }
}

// 淘宝数据收集模板
class TaobaoTemplate {
    async collect() {
        const data = [];
        
        if (this.isProductPage()) {
            const productData = await this.collectProductData();
            if (productData) data.push(productData);
        } else if (this.isSearchPage()) {
            const searchData = await this.collectSearchData();
            data.push(...searchData);
        }
        
        return data;
    }

    isProductPage() {
        return window.location.href.includes('detail.tmall.com') ||
               window.location.href.includes('item.taobao.com');
    }

    isSearchPage() {
        return window.location.href.includes('s.taobao.com') ||
               window.location.href.includes('list.tmall.com');
    }

    async collectProductData() {
        return {
            title: '淘宝商品',
            name: DataCollector.getElementText(document.querySelector('h1[data-spm], .tb-detail-hd h1')),
            price: DataCollector.getPrice(DataCollector.getElementText(document.querySelector('.tm-price, .tb-rmb-num'))),
            seller: DataCollector.getElementText(document.querySelector('.seller-name, .shop-name a')),
            rating: DataCollector.getElementText(document.querySelector('.rate-score, .score-average')),
            url: window.location.href
        };
    }

    async collectSearchData() {
        const items = document.querySelectorAll('.item, .product, [data-category="auctions"]');
        return Array.from(items).slice(0, 20).map((item, index) => ({
            title: '搜索结果 ' + (index + 1),
            name: DataCollector.getElementText(item.querySelector('.title, .product-title a')),
            price: DataCollector.getPrice(DataCollector.getElementText(item.querySelector('.price, .price-current'))),
            seller: DataCollector.getElementText(item.querySelector('.shopname, .seller')),
            url: DataCollector.getElementAttribute(item.querySelector('a'), 'href')
        })).filter(item => item.name);
    }
}

// 京东数据收集模板
class JDTemplate {
    async collect() {
        const data = [];
        
        if (this.isProductPage()) {
            const productData = await this.collectProductData();
            if (productData) data.push(productData);
        } else if (this.isSearchPage()) {
            const searchData = await this.collectSearchData();
            data.push(...searchData);
        }
        
        return data;
    }

    isProductPage() {
        return window.location.href.includes('item.jd.com');
    }

    isSearchPage() {
        return window.location.href.includes('search.jd.com') ||
               window.location.href.includes('list.jd.com');
    }

    async collectProductData() {
        return {
            title: '京东商品',
            name: DataCollector.getElementText(document.querySelector('.sku-name, #name h1')),
            price: DataCollector.getPrice(DataCollector.getElementText(document.querySelector('.price, .p-price .price'))),
            seller: DataCollector.getElementText(document.querySelector('.seller-name, .J-hovercard')),
            rating: DataCollector.getElementText(document.querySelector('.comment-score, .score')),
            url: window.location.href
        };
    }

    async collectSearchData() {
        const items = document.querySelectorAll('.gl-item, .goods-item');
        return Array.from(items).slice(0, 20).map((item, index) => ({
            title: '搜索结果 ' + (index + 1),
            name: DataCollector.getElementText(item.querySelector('.p-name em, .p-name a')),
            price: DataCollector.getPrice(DataCollector.getElementText(item.querySelector('.p-price i'))),
            seller: DataCollector.getElementText(item.querySelector('.p-shopnum a')),
            url: DataCollector.getElementAttribute(item.querySelector('.p-name a'), 'href')
        })).filter(item => item.name);
    }
}

// 自定义模板（用户可以配置）
class CustomTemplate {
    async collect() {
        // 这里可以实现用户自定义的数据收集逻辑
        // 暂时返回页面基础信息
        return [{
            title: '自定义收集',
            pageTitle: document.title,
            url: window.location.href,
            links: Array.from(document.querySelectorAll('a')).slice(0, 10).map(a => ({
                text: DataCollector.getElementText(a),
                href: a.href
            })).filter(link => link.text),
            images: Array.from(document.querySelectorAll('img')).slice(0, 10).map(img => img.src)
        }];
    }
}

// 初始化数据收集器
const dataCollector = new DataCollector();
