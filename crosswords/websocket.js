/**
 * Global WebSocket Manager - Singleton Pattern
 * Provides a single WebSocket connection accessible from anywhere
 */
class WebSocketManager {
    constructor() {
        this.socket = null;
        this.url = null;
        this.messageHandlers = new Map(); // Map<messageType, Set<handlers>>
        this.isReconnecting = false;
        this.reconnectDelay = 3000;
        this.notificationManager = null; // Will be set when available
    }

    /**
     * Set notification manager for displaying connection status
     */
    setNotificationManager(notificationMgr) {
        this.notificationManager = notificationMgr;
    }

    /**
     * Initialize connection with URL
     */
    connect(url) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.warn('WebSocket already connected');
            return;
        }

        this.url = url;
        console.log(`Connecting to WebSocket at ${this.url}...`);
        
        this.socket = new WebSocket(this.url);
        this.socket.onopen = (event) => this._onOpen(event);
        this.socket.onclose = (event) => this._onClose(event);
        this.socket.onerror = (event) => this._onError(event);
        this.socket.onmessage = (event) => this._onMessage(event);
    }

    /**
     * Send message as JSON
     */
    send(message) {
        if (!this.isConnected()) {
            console.error('WebSocket not connected, cannot send message:', message);
            return false;
        }
        
        try {
            const jsonMsg = JSON.stringify(message);
            this.socket.send(jsonMsg);
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }

    /**
     * Check if socket is connected
     */
    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * Register handler for specific message type
     * @param {string} messageType - e.g., 'available_session_properties'
     * @param {function} handler - callback function
     */
    onMessage(messageType, handler) {
        if (!this.messageHandlers.has(messageType)) {
            this.messageHandlers.set(messageType, new Set());
        }
        this.messageHandlers.get(messageType).add(handler);
    }

    /**
     * Unregister handler for specific message type
     */
    offMessage(messageType, handler) {
        if (this.messageHandlers.has(messageType)) {
            this.messageHandlers.get(messageType).delete(handler);
        }
    }

    /**
     * Register global message handler (for all message types)
     */
    onAnyMessage(handler) {
        if (!this.messageHandlers.has('*')) {
            this.messageHandlers.set('*', new Set());
        }
        this.messageHandlers.get('*').add(handler);
    }

    /**
     * Internal handler - called on socket open
     */
    _onOpen(event) {
        console.log('WebSocket connected');
        this.isReconnecting = false;
        if (this.notificationManager) {
            this.notificationManager.success('Connected to server', 3000);
        }
        this._callHandlers('open', { type: 'open' });
    }

    /**
     * Internal handler - called on socket close
     */
    _onClose(event) {
        console.log('WebSocket closed');
        if (this.notificationManager) {
            this.notificationManager.info('Connection lost, reconnecting...', 0); // No auto-dismiss
        }
        this._callHandlers('close', { type: 'close' });
        
        if (!this.isReconnecting) {
            this.isReconnecting = true;
            setTimeout(() => this.connect(this.url), this.reconnectDelay);
        }
    }

    /**
     * Internal handler - called on socket error
     */
    _onError(event) {
        console.error('WebSocket error:', event);
        if (this.notificationManager) {
            this.notificationManager.error('Connection error', 4000);
        }
        this._callHandlers('error', { type: 'error', error: event });
        
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close();
        }
    }

    /**
     * Internal handler - called on incoming message
     */
    _onMessage(event) {
        try {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);
            
            // Call type-specific handlers
            if (message.type && this.messageHandlers.has(message.type)) {
                this._callHandlers(message.type, message);
            }
            
            // Call global handlers
            this._callHandlers('*', message);
        } catch (error) {
            console.error('Error parsing message:', error);
            this._callHandlers('error', { type: 'error', error: error });
        }
    }

    /**
     * Internal - call all registered handlers for a message type
     */
    _callHandlers(messageType, message) {
        if (this.messageHandlers.has(messageType)) {
            this.messageHandlers.get(messageType).forEach(handler => {
                try {
                    handler(message);
                } catch (error) {
                    console.error(`Error in message handler for ${messageType}:`, error);
                }
            });
        }
    }

    /**
     * Close connection
     */
    close() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isReconnecting = false;
    }
}

// Create global singleton instance
const wsManager = new WebSocketManager();

export default wsManager;
