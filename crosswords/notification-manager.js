/**
 * Global Notification Manager - Singleton Pattern
 * Provides a simple notification system accessible from anywhere
 * Always displays the last message with auto-dismissal after timeout
 */
class NotificationManager {
    constructor() {
        this.currentNotification = null;
        this.dismissTimeout = null;
        this.notificationElement = null;
        this.defaultDuration = 5000; // 5 seconds
    }

    /**
     * Set reference to notification element (called by notification-area component)
     */
    setNotificationElement(element) {
        this.notificationElement = element;
    }

    /**
     * Show success message
     */
    success(message, duration = this.defaultDuration) {
        this.show(message, 'success', duration);
    }

    /**
     * Show info message
     */
    info(message, duration = this.defaultDuration) {
        this.show(message, 'info', duration);
    }

    /**
     * Show error message (longer duration)
     */
    error(message, duration = this.defaultDuration + 2000) {
        this.show(message, 'error', duration);
    }

    /**
     * Show generic message
     * @param {string} message - The message to display
     * @param {string} type - 'success', 'info', or 'error'
     * @param {number} duration - Auto-dismiss after this many ms (0 = manual dismiss)
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        // Clear existing timeout
        if (this.dismissTimeout) {
            clearTimeout(this.dismissTimeout);
        }

        // Store current notification
        this.currentNotification = {
            message,
            type,
            timestamp: Date.now()
        };

        // Update UI if element exists
        if (this.notificationElement) {
            this.notificationElement.setNotification(message, type);
        }

        console.log(`[${type.toUpperCase()}] ${message}`);

        // Auto-dismiss after duration (0 = no auto-dismiss)
        if (duration > 0) {
            this.dismissTimeout = setTimeout(() => this.dismiss(), duration);
        }
    }

    /**
     * Dismiss current notification
     */
    dismiss() {
        if (this.dismissTimeout) {
            clearTimeout(this.dismissTimeout);
            this.dismissTimeout = null;
        }

        this.currentNotification = null;

        if (this.notificationElement) {
            this.notificationElement.clearNotification();
        }
    }

    /**
     * Get current notification info
     */
    getCurrent() {
        return this.currentNotification;
    }
}

// Create global singleton instance
const notificationManager = new NotificationManager();

export default notificationManager;
