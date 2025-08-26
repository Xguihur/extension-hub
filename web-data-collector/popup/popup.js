// 简化版淘宝商品信息收集器
class TaobaoCollector {
    constructor() {
        this.currentTab = null;
        this.init();
    }

    async init() {
        // 获取当前标签页
        await this.getCurrentTab();
        
        // 检查是否是淘宝页面
        this.checkTaobaoPage();
        
        // 绑定事件
        this.bindEvents();
    }

    async getCurrentTab() {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        this.currentTab = tabs[0];
    }

    checkTaobaoPage() {
        const statusEl = document.getElementById('status');
        const collectBtn = document.getElementById('collect-btn');
        
        if (!this.currentTab?.url) {
            statusEl.textContent = '无效页面';
            collectBtn.disabled = true;
            return;
        }

        const url = this.currentTab.url;
        const isTaobao = url.includes('taobao.com') || url.includes('tmall.com');
        
        if (isTaobao) {
            statusEl.textContent = '✓ 淘宝页面';
            statusEl.style.background = 'rgba(0, 255, 0, 0.2)';
            collectBtn.disabled = false;
        } else {
            statusEl.textContent = '非淘宝页面';
            collectBtn.disabled = true;
        }
    }

    bindEvents() {
        document.getElementById('collect-btn').addEventListener('click', () => {
            this.collectProductInfo();
        });
    }

    async collectProductInfo() {
        const collectBtn = document.getElementById('collect-btn');
        const productInfo = document.getElementById('product-info');
        
        // 显示加载状态
        collectBtn.disabled = true;
        collectBtn.textContent = '获取中...';
        productInfo.innerHTML = '<div class="loading">正在获取商品信息...</div>';

        try {
            // 向content script发送消息
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'getProductInfo'
            });

            if (response && response.success) {
                this.displayProductInfo(response.data);
            } else {
                throw new Error(response?.error || '获取失败');
            }
        } catch (error) {
            console.error('获取商品信息失败:', error);
            productInfo.innerHTML = `
                <div class="error">
                    获取失败<br>
                    <small>${error.message}</small>
                </div>
            `;
        } finally {
            collectBtn.disabled = false;
            collectBtn.textContent = '获取商品信息';
        }
    }

    displayProductInfo(data) {
        const productInfo = document.getElementById('product-info');
        
        if (!data || Object.keys(data).length === 0) {
            productInfo.innerHTML = `
                <div class="error">
                    未找到商品信息<br>
                    <small>请确保在商品详情页</small>
                </div>
            `;
            return;
        }

        const html = `
            <div class="product-details">
                ${data.title ? `<div class="product-title">${data.title}</div>` : ''}
                ${this.renderField('价格', data.price, 'price')}
                ${this.renderField('原价', data.originalPrice)}
                ${this.renderField('销量', data.sales)}
                ${this.renderField('店铺', data.shop)}
                ${this.renderField('评价', data.rating)}
                ${this.renderField('地址', data.location)}
                ${this.renderField('商品ID', data.itemId)}
            </div>
        `;
        
        productInfo.innerHTML = html;
    }

    renderField(label, value, className = '') {
        if (!value || value === '') return '';
        
        return `
            <div class="product-field">
                <span class="field-label">${label}</span>
                <span class="field-value ${className}">${value}</span>
            </div>
        `;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new TaobaoCollector();
});