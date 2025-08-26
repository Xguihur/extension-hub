// popup.js - 弹出面板的主要逻辑

class PopupManager {
    constructor() {
        this.currentTab = null;
        this.currentTemplate = null;
        this.collectedData = [];
        this.isCollecting = false;
        
        this.init();
    }

    async init() {
        // 获取当前标签页信息
        await this.getCurrentTab();
        
        // 初始化界面
        this.initUI();
        
        // 绑定事件监听器
        this.bindEventListeners();
        
        // 加载设置和历史记录
        await this.loadSettings();
        await this.loadHistory();
        
        // 检查连接状态
        await this.checkConnectionStatus();
    }

    async getCurrentTab() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tabs[0];
            
            if (this.currentTab) {
                this.updateSiteInfo(this.currentTab);
            }
        } catch (error) {
            console.error('获取当前标签页失败:', error);
        }
    }

    updateSiteInfo(tab) {
        const siteTitle = document.getElementById('site-title');
        const siteUrl = document.getElementById('site-url');
        const siteFavicon = document.getElementById('site-favicon');

        siteTitle.textContent = tab.title || '未知标题';
        siteUrl.textContent = this.formatUrl(tab.url);
        
        // 设置favicon
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(tab.url).hostname}&sz=32`;
        siteFavicon.src = faviconUrl;
        siteFavicon.onerror = () => {
            siteFavicon.src = '../icons/icon32.png';
        };
    }

    formatUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname + urlObj.pathname;
        } catch {
            return url;
        }
    }

    initUI() {
        // 检查当前网站是否匹配已知模板
        this.detectWebsiteTemplate();
    }

    detectWebsiteTemplate() {
        if (!this.currentTab?.url) return;

        const templateSelect = document.getElementById('template-select');
        const startButton = document.getElementById('start-collect');

        // 检测网站类型
        const hostname = new URL(this.currentTab.url).hostname;
        let detectedTemplate = '';

        if (hostname.includes('douyin.com') || hostname.includes('dy.com')) {
            detectedTemplate = 'douyin';
        } else if (hostname.includes('taobao.com') || hostname.includes('tmall.com')) {
            detectedTemplate = 'taobao';
        } else if (hostname.includes('jd.com') || hostname.includes('360buy.com')) {
            detectedTemplate = 'jd';
        }

        if (detectedTemplate) {
            templateSelect.value = detectedTemplate;
            startButton.disabled = false;
            this.currentTemplate = detectedTemplate;
            
            // 显示检测到的模板
            this.showTemplateDetected(detectedTemplate);
        }
    }

    showTemplateDetected(template) {
        const templateNames = {
            'douyin': '抖音商城',
            'taobao': '淘宝商品',
            'jd': '京东商品'
        };
        
        // 可以添加一个提示信息
        console.log(`检测到网站模板: ${templateNames[template]}`);
    }

    bindEventListeners() {
        // 模板选择
        document.getElementById('template-select').addEventListener('change', (e) => {
            this.currentTemplate = e.target.value;
            document.getElementById('start-collect').disabled = !e.target.value;
        });

        // 开始收集按钮
        document.getElementById('start-collect').addEventListener('click', () => {
            this.startDataCollection();
        });

        // 刷新数据按钮
        document.getElementById('refresh-data').addEventListener('click', () => {
            this.refreshData();
        });

        // 导出数据按钮
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        // 清空历史记录
        document.getElementById('clear-history').addEventListener('click', () => {
            this.clearHistory();
        });

        // 设置相关
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });

        document.getElementById('close-settings').addEventListener('click', () => {
            this.hideSettings();
        });

        // 设置选项变更
        document.getElementById('auto-collect').addEventListener('change', (e) => {
            this.saveSetting('autoCollect', e.target.checked);
        });

        document.getElementById('show-notifications').addEventListener('change', (e) => {
            this.saveSetting('showNotifications', e.target.checked);
        });

        document.getElementById('storage-days').addEventListener('change', (e) => {
            this.saveSetting('storageDays', e.target.value);
        });
    }

    async startDataCollection() {
        if (this.isCollecting) return;

        this.isCollecting = true;
        this.updateStatus('active', '正在收集...');
        
        try {
            // 向content script发送收集数据的请求
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'collectData',
                template: this.currentTemplate
            });

            if (response && response.success) {
                this.collectedData = response.data;
                this.displayCollectedData(response.data);
                this.saveToHistory(response.data);
                this.updateStatus('active', '收集完成');
            } else {
                throw new Error(response?.error || '数据收集失败');
            }
        } catch (error) {
            console.error('数据收集失败:', error);
            this.updateStatus('inactive', '收集失败');
            this.showError('数据收集失败: ' + error.message);
        }

        this.isCollecting = false;
    }

    displayCollectedData(data) {
        const container = document.getElementById('data-container');
        container.innerHTML = '';

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <p>未收集到数据</p>
                    <p class="empty-hint">请检查页面内容</p>
                </div>
            `;
            return;
        }

        data.forEach((item, index) => {
            const itemEl = this.createDataItemElement(item, index);
            container.appendChild(itemEl);
        });
    }

    createDataItemElement(item, index) {
        const div = document.createElement('div');
        div.className = 'data-item';
        div.innerHTML = `
            <div class="data-item-header">
                ${item.title || `数据项 ${index + 1}`}
            </div>
            <div class="data-item-content">
                ${this.formatDataFields(item)}
            </div>
        `;
        return div;
    }

    formatDataFields(item) {
        if (typeof item === 'string') {
            return `<div class="data-field-value">${item}</div>`;
        }

        let html = '';
        Object.entries(item).forEach(([key, value]) => {
            if (key !== 'title') {
                html += `
                    <div class="data-field">
                        <span class="data-field-label">${this.translateFieldName(key)}:</span>
                        <span class="data-field-value">${this.formatFieldValue(value)}</span>
                    </div>
                `;
            }
        });
        return html;
    }

    translateFieldName(key) {
        const translations = {
            'price': '价格',
            'title': '标题',
            'description': '描述',
            'image': '图片',
            'url': '链接',
            'rating': '评分',
            'reviews': '评价数',
            'seller': '卖家',
            'category': '分类',
            'brand': '品牌',
            'stock': '库存'
        };
        return translations[key] || key;
    }

    formatFieldValue(value) {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '');
    }

    async refreshData() {
        if (this.currentTemplate) {
            await this.startDataCollection();
        }
    }

    exportData() {
        if (this.collectedData.length === 0) {
            this.showError('没有可导出的数据');
            return;
        }

        const dataStr = JSON.stringify(this.collectedData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `collected-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async saveToHistory(data) {
        const historyItem = {
            id: Date.now(),
            url: this.currentTab.url,
            title: this.currentTab.title,
            template: this.currentTemplate,
            data: data,
            timestamp: new Date().toISOString()
        };

        const result = await chrome.storage.local.get(['dataHistory']);
        const history = result.dataHistory || [];
        history.unshift(historyItem);

        // 限制历史记录数量
        const maxHistory = 50;
        if (history.length > maxHistory) {
            history.splice(maxHistory);
        }

        await chrome.storage.local.set({ dataHistory: history });
        this.displayHistory(history);
    }

    async loadHistory() {
        const result = await chrome.storage.local.get(['dataHistory']);
        const history = result.dataHistory || [];
        this.displayHistory(history);
    }

    displayHistory(history) {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-state"><p>暂无历史记录</p></div>';
            return;
        }

        history.slice(0, 10).forEach(item => {
            const historyEl = this.createHistoryItemElement(item);
            historyList.appendChild(historyEl);
        });
    }

    createHistoryItemElement(item) {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <span class="history-site">${new URL(item.url).hostname}</span>
            <span class="history-time">${this.formatTime(item.timestamp)}</span>
        `;
        
        div.addEventListener('click', () => {
            this.collectedData = item.data;
            this.displayCollectedData(item.data);
        });

        return div;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        return Math.floor(diff / 86400000) + '天前';
    }

    async clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            await chrome.storage.local.set({ dataHistory: [] });
            this.displayHistory([]);
        }
    }

    async loadSettings() {
        const result = await chrome.storage.local.get([
            'autoCollect',
            'showNotifications',
            'storageDays'
        ]);

        document.getElementById('auto-collect').checked = result.autoCollect || false;
        document.getElementById('show-notifications').checked = result.showNotifications || true;
        document.getElementById('storage-days').value = result.storageDays || '30';
    }

    async saveSetting(key, value) {
        await chrome.storage.local.set({ [key]: value });
    }

    showSettings() {
        document.getElementById('settings-panel').classList.remove('hidden');
    }

    hideSettings() {
        document.getElementById('settings-panel').classList.add('hidden');
    }

    updateStatus(status, text) {
        const dot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        dot.className = `status-dot ${status}`;
        statusText.textContent = text;
    }

    async checkConnectionStatus() {
        try {
            await chrome.tabs.sendMessage(this.currentTab.id, { action: 'ping' });
            this.updateStatus('active', '已连接');
        } catch {
            this.updateStatus('inactive', '未连接');
        }
    }

    showError(message) {
        // 可以实现一个错误提示UI
        console.error(message);
        alert(message);
    }
}

// 当popup加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
