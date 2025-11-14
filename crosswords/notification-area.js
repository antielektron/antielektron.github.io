import { LitElement, html } from 'https://unpkg.com/lit-element/lit-element.js?module';
import notificationManager from './notification-manager.js';

export class NotificationArea extends LitElement {
    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            _message: { state: true },
            _type: { state: true },
            _visible: { state: true }
        };
    }

    constructor() {
        super();
        this._message = '';
        this._type = 'info'; // success, info, error
        this._visible = false;
    }

    connectedCallback() {
        super.connectedCallback();
        // Register this element with the global notification manager
        notificationManager.setNotificationElement(this);
    }

    /**
     * Called by NotificationManager to show a notification
     */
    setNotification(message, type) {
        this._message = message;
        this._type = type;
        this._visible = true;
        this.requestUpdate();
    }

    /**
     * Called by NotificationManager to clear notification
     */
    clearNotification() {
        this._visible = false;
        this.requestUpdate();
    }

    render() {
        if (!this._visible) {
            return html`<div class="notification-area"></div>`;
        }

        return html`
            <div class="notification-area">
                <div class="notification notification-${this._type}">
                    <span class="notification-message">${this._message}</span>
                    <button class="notification-close" @click="${() => this.clearNotification()}" aria-label="Close notification">
                        ✕
                    </button>
                </div>
            </div>
        `;
    }
}

customElements.define('notification-area', NotificationArea);
