import Constant from './constant.js';

class ChromeService {
    constructor() {
        this.connection = null;
        this.listeners = [];
        this.isConnected = false;
        this.connect();
    }

    connect() {
        try {
            this.connection = chrome.runtime.connect({ name: "index-background-connection" });
            this.isConnected = true;

            this.connection.onDisconnect.addListener(() => {
                console.log('Disconnected from background, reconnecting...');
                this.isConnected = false;
                setTimeout(() => this.connect(), 1000);
            });

            this.connection.onMessage.addListener((message) => {
                this.notifyListeners(message);
            });
        } catch (e) {
            console.error('Failed to connect to chrome runtime:', e);
        }
    }

    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notifyListeners(message) {
        this.listeners.forEach(listener => {
            try {
                listener(message);
            } catch (e) {
                console.error('Error in listener:', e);
            }
        });
    }

    postMessage(message) {
        if (this.connection && this.isConnected) {
            try {
                this.connection.postMessage(message);
            } catch (e) {
                console.error('Failed to post message:', e);
            }
        } else {
            console.warn('Connection not ready, retrying in 500ms...');
            setTimeout(() => this.postMessage(message), 500);
        }
    }
}

const chromeService = new ChromeService();
export default chromeService;
