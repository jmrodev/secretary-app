const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');

/**
 * WhatsApp Bridge Service
 * Ensures the Go bridge is running and manages its lifecycle.
 */
class WhatsAppBridgeService {
    constructor() {
        this.bridgeProcess = null;
        this.bridgeUrl = 'http://127.0.0.1:8090/api/status';
        this.isStarting = false;
    }

    /**
     * Checks if the bridge is currently responding
     */
    async isBridgeRunning() {
        try {
            const response = await axios.get(this.bridgeUrl, { timeout: 2000 });
            return response.status === 200;
        } catch (_error) {
            return false;
        }
    }

    /**
     * Starts the Go bridge process
     */
    async startBridge() {
        if (this.isStarting) return;
        
        const isRunning = await this.isBridgeRunning();
        if (isRunning) {
            console.log('✅ WhatsApp Bridge is already running.');
            return;
        }

        this.isStarting = true;
        console.log('🚀 Starting WhatsApp Bridge (Go)...');

        const bridgeDir = path.resolve(__dirname, '../../whatsapp-bridge-go');
        
        // Use go run main.go
        this.bridgeProcess = spawn('go', ['run', 'main.go'], {
            cwd: bridgeDir,
            stdio: 'inherit', // Let it print to server logs
            shell: true
        });

        this.bridgeProcess.on('error', (err) => {
            console.error('❌ Failed to start WhatsApp Bridge:', err);
            this.isStarting = false;
        });

        this.bridgeProcess.on('exit', (code) => {
            console.log(`📴 WhatsApp Bridge exited with code ${code}`);
            this.isStarting = false;
            this.bridgeProcess = null;
            
            // Restart after 5 seconds if it crashed
            if (code !== 0) {
                setTimeout(() => this.startBridge(), 5000);
            }
        });

        // Wait a bit and check again
        setTimeout(async () => {
            const nowRunning = await this.isBridgeRunning();
            if (nowRunning) {
                console.log('✨ WhatsApp Bridge successfully started and responding.');
            }
            this.isStarting = false;
        }, 5000);
    }

    /**
     * Stops the bridge process
     */
    stopBridge() {
        if (this.bridgeProcess) {
            console.log('🛑 Stopping WhatsApp Bridge...');
            this.bridgeProcess.kill();
        }
    }
}

module.exports = new WhatsAppBridgeService();
