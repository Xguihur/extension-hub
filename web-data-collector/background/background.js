// background.js - 后台服务工作脚本

class BackgroundService {
    constructor() {
        this.init();
    }

    init() {
        // 监听插件安装
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstalled(details);
        });

        // 监听插件启动
        chrome.runtime.onStartup.addListener(() => {
            this.handleStartup();
        });

        // 监听消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true;
        });

        // 监听标签页更新
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdated(tabId, changeInfo, tab);
        });

        // 监听标签页激活
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.handleTabActivated(activeInfo);
        });

        console.log('Background service initialized');
    }

    async handleInstalled(details) {
        console.log('插件安装/更新:', details.reason);

        // 设置默认配置
        await this.setDefaultSettings();

        // 创建上下文菜单
        this.createContextMenus();

        if (details.reason === 'install') {
            // 首次安装时的欢迎页面
            this.showWelcomePage();
        }
    }

    handleStartup() {
        console.log('插件启动');
        // 清理过期的数据
        this.cleanupOldData();
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'getTabInfo':
                    const tabInfo = await this.getActiveTabInfo();
                    sendResponse({ success: true, data: tabInfo });
                    break;

                case 'saveData':
                    await this.saveCollectedData(request.data);
                    sendResponse({ success: true });
                    break;

                case 'exportData':
                    const exportResult = await this.exportData(request.format);
                    sendResponse({ success: true, data: exportResult });
                    break;

                case 'getSettings':
                    const settings = await this.getSettings();
                    sendResponse({ success: true, data: settings });
                    break;

                case 'updateSettings':
                    await this.updateSettings(request.settings);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: '未知的操作类型' });
            }
        } catch (error) {
            console.error('处理消息时出错:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async handleTabUpdated(tabId, changeInfo, tab) {
        // 当标签页URL变化时，检查是否需要自动收集数据
        if (changeInfo.status === 'complete' && tab.url) {
            await this.checkAutoCollect(tab);
        }
    }

    async handleTabActivated(activeInfo) {
        // 标签页激活时的处理
        const tab = await chrome.tabs.get(activeInfo.tabId);
        console.log('切换到标签页:', tab.url);
    }

    async setDefaultSettings() {
        const defaultSettings = {
            autoCollect: false,
            showNotifications: true,
            storageDays: 30,
            maxHistoryItems: 100,
            enabledTemplates: ['douyin', 'taobao', 'jd'],
            customTemplates: []
        };

        const result = await chrome.storage.local.get(Object.keys(defaultSettings));
        const settingsToSet = {};

        // 只设置不存在的设置项
        Object.keys(defaultSettings).forEach(key => {
            if (!(key in result)) {
                settingsToSet[key] = defaultSettings[key];
            }
        });

        if (Object.keys(settingsToSet).length > 0) {
            await chrome.storage.local.set(settingsToSet);
        }
    }

    createContextMenus() {
        // 清除现有菜单
        chrome.contextMenus.removeAll(() => {
            // 创建主菜单
            chrome.contextMenus.create({
                id: 'collect-data',
                title: '收集页面数据',
                contexts: ['page']
            });

            chrome.contextMenus.create({
                id: 'collect-selection',
                title: '收集选中内容',
                contexts: ['selection']
            });

            chrome.contextMenus.create({
                id: 'separator',
                type: 'separator',
                contexts: ['page']
            });

            chrome.contextMenus.create({
                id: 'open-history',
                title: '查看历史记录',
                contexts: ['page']
            });
        });

        // 监听菜单点击
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });
    }

    async handleContextMenuClick(info, tab) {
        switch (info.menuItemId) {
            case 'collect-data':
                await this.collectDataFromTab(tab);
                break;
            case 'collect-selection':
                await this.collectSelectedText(info, tab);
                break;
            case 'open-history':
                await this.openHistoryPage();
                break;
        }
    }

    async collectDataFromTab(tab) {
        try {
            // 检测网站类型并收集数据
            const template = this.detectWebsiteTemplate(tab.url);
            if (template) {
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'collectData',
                    template: template
                });

                if (response && response.success) {
                    await this.saveCollectedData({
                        ...response.data,
                        source: 'contextMenu',
                        tabInfo: {
                            id: tab.id,
                            url: tab.url,
                            title: tab.title
                        }
                    });

                    this.showNotification('数据收集完成', `从 ${new URL(tab.url).hostname} 收集了数据`);
                }
            } else {
                this.showNotification('不支持的网站', '当前网站暂不支持数据收集');
            }
        } catch (error) {
            console.error('右键菜单收集数据失败:', error);
            this.showNotification('收集失败', error.message);
        }
    }

    async collectSelectedText(info, tab) {
        const data = {
            title: '选中文本',
            selectedText: info.selectionText,
            url: tab.url,
            timestamp: new Date().toISOString()
        };

        await this.saveCollectedData(data);
        this.showNotification('文本已保存', '选中的文本已添加到收集记录');
    }

    async openHistoryPage() {
        // 可以打开一个专门的历史记录页面
        chrome.tabs.create({
            url: chrome.runtime.getURL('popup/popup.html')
        });
    }

    detectWebsiteTemplate(url) {
        if (!url) return null;

        const hostname = new URL(url).hostname.toLowerCase();
        
        if (hostname.includes('douyin.com') || hostname.includes('dy.com')) {
            return 'douyin';
        } else if (hostname.includes('taobao.com') || hostname.includes('tmall.com')) {
            return 'taobao';
        } else if (hostname.includes('jd.com') || hostname.includes('360buy.com')) {
            return 'jd';
        }

        return null;
    }

    async checkAutoCollect(tab) {
        const settings = await this.getSettings();
        if (!settings.autoCollect) return;

        const template = this.detectWebsiteTemplate(tab.url);
        if (template && settings.enabledTemplates.includes(template)) {
            // 延迟执行自动收集，避免页面还未完全加载
            setTimeout(() => {
                this.collectDataFromTab(tab);
            }, 2000);
        }
    }

    async getActiveTabInfo() {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        return tabs[0] || null;
    }

    async saveCollectedData(data) {
        const result = await chrome.storage.local.get(['dataHistory']);
        const history = result.dataHistory || [];

        const dataItem = {
            id: Date.now(),
            ...data,
            timestamp: new Date().toISOString()
        };

        history.unshift(dataItem);

        // 限制历史记录数量
        const maxItems = await this.getSettings().then(s => s.maxHistoryItems || 100);
        if (history.length > maxItems) {
            history.splice(maxItems);
        }

        await chrome.storage.local.set({ dataHistory: history });
        return dataItem;
    }

    async exportData(format = 'json') {
        const result = await chrome.storage.local.get(['dataHistory']);
        const history = result.dataHistory || [];

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(history, null, 2);
            case 'csv':
                return this.convertToCSV(history);
            default:
                throw new Error('不支持的导出格式');
        }
    }

    convertToCSV(data) {
        if (data.length === 0) return '';

        // 获取所有可能的字段
        const allKeys = new Set();
        data.forEach(item => {
            Object.keys(item).forEach(key => {
                if (typeof item[key] !== 'object') {
                    allKeys.add(key);
                }
            });
        });

        const headers = Array.from(allKeys);
        const csvRows = [headers.join(',')];

        data.forEach(item => {
            const row = headers.map(header => {
                const value = item[header] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    async getSettings() {
        const result = await chrome.storage.local.get([
            'autoCollect', 'showNotifications', 'storageDays', 
            'maxHistoryItems', 'enabledTemplates', 'customTemplates'
        ]);
        return result;
    }

    async updateSettings(newSettings) {
        await chrome.storage.local.set(newSettings);
        console.log('设置已更新:', newSettings);
    }

    async cleanupOldData() {
        const settings = await this.getSettings();
        const storageDays = settings.storageDays || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - storageDays);

        const result = await chrome.storage.local.get(['dataHistory']);
        const history = result.dataHistory || [];

        const filteredHistory = history.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate > cutoffDate;
        });

        if (filteredHistory.length !== history.length) {
            await chrome.storage.local.set({ dataHistory: filteredHistory });
            console.log(`清理了 ${history.length - filteredHistory.length} 条过期记录`);
        }
    }

    showNotification(title, message) {
        this.getSettings().then(settings => {
            if (settings.showNotifications) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: '../icons/icon48.png',
                    title: title,
                    message: message
                });
            }
        });
    }

    showWelcomePage() {
        // 可以创建一个欢迎页面或者显示通知
        this.showNotification(
            '欢迎使用数据收集器', 
            '点击插件图标开始收集网页数据！'
        );
    }
}

// 初始化后台服务
const backgroundService = new BackgroundService();
