import { html, LitElement } from 'https://unpkg.com/lit-element/lit-element.js?module';
import wsManager from './websocket.js';
import notificationManager from './notification-manager.js';

export class CrosswordMenu extends LitElement {
    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            _loading: { state: true },
            _error: { state: true },
            _sessionProperties: { state: true },
            _selectedLanguage: { state: true },
            _selectedBoardSize: { state: true }
        };
    }

    constructor() {
        super();
        this._loading = true;
        this._error = null;
        this._sessionProperties = null;
        this._selectedLanguage = '';
        this._selectedBoardSize = '';
    }

    connectedCallback() {
        super.connectedCallback();
        // Register notification manager with WebSocket
        wsManager.setNotificationManager(notificationManager);
        this._initializeConnection();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Remove message handlers
        wsManager.offMessage('available_session_properties', this._handleSessionProperties);
        wsManager.offMessage('error', this._handleError);
    }

    _initializeConnection() {
        // Register message handlers
        wsManager.onMessage('available_session_properties', (msg) => this._handleSessionProperties(msg));
        wsManager.onMessage('error', (msg) => this._handleError(msg));
        // Also listen for open event to request properties when connection is established
        wsManager.onMessage('open', (msg) => this._requestSessionProperties());

        // Connect if not already connected
        if (!wsManager.isConnected()) {
            const wsUrl = this._getWebsocketUrl();
            wsManager.connect(wsUrl);
        } else {
            // Already connected, request session properties
            this._requestSessionProperties();
        }
    }

    _getWebsocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = window.location.hostname;
        
        // If host is localhost, use port 8765. Otherwise, use default port (443 for wss, 80 for ws)
        const isLocalhost = host === 'localhost' || host === '127.0.0.1';
        const port = isLocalhost ? 8765 : '';
        const portStr = port ? `:${port}` : '';
        
        // If host is localhost, use it as is. Otherwise, add crosswords_backend/ to the path
        const path = isLocalhost ? '' : 'crosswords_backend/';
        
        return `${protocol}://${host}${portStr}/${path}`;
    }

    _requestSessionProperties() {
        const message = {
            type: 'get_available_session_properties'
        };
        wsManager.send(message);
    }

    _handleSessionProperties(message) {
        this._sessionProperties = {
            supported_languages: message.supported_languages,
            min_grid_size: message.min_grid_size,
            max_grid_size: message.max_grid_size,
            board_size_presets: message.board_size_presets
        };
        
        // Set default selections
        if (this._sessionProperties.supported_languages.length > 0) {
            this._selectedLanguage = this._sessionProperties.supported_languages[0];
        }
        
        if (this._sessionProperties.board_size_presets && Object.keys(this._sessionProperties.board_size_presets).length > 0) {
            this._selectedBoardSize = Object.keys(this._sessionProperties.board_size_presets)[0];
        }
        
        this._loading = false;
        this._error = null;
        notificationManager.success('Game options loaded');
        this.requestUpdate();
    }

    _handleError(message) {
        this._error = message.error_message || 'An error occurred';
        notificationManager.error(this._error);
        this.requestUpdate();
    }

    _onLanguageChange(event) {
        this._selectedLanguage = event.target.value;
    }

    _onBoardSizeChange(event) {
        this._selectedBoardSize = event.target.value;
    }

    _onCreateCrossword() {
        const boardDimensions = this._sessionProperties.board_size_presets[this._selectedBoardSize];
        const [gridW, gridH] = boardDimensions;

        console.log('Creating crossword with:', {
            language: this._selectedLanguage,
            grid_w: gridW,
            grid_h: gridH
        });

        // Send session creation message to server
        const message = {
            type: 'new_multiplayer_session',
            lang: this._selectedLanguage,
            grid_w: gridW,
            grid_h: gridH
        };

        wsManager.send(message);
        notificationManager.info('Creating session...');
    }

    _toggleDataInfo() {
        const element = this.querySelector('.data-info-details');
        if (element) {
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
        }
    }

    render() {
        if (this._loading) {
            return html`
                <div class="menu-container">
                    <div class="loading">Loading game options...</div>
                </div>
            `;
        }

        if (!this._sessionProperties) {
            return html`
                <div class="menu-container">
                    <div class="menu">
                        <div class="error">Failed to load game options. Retrying...</div>
                    </div>
                </div>
            `;
        }

        return html`
            <div class="menu-container">
                <div class="menu">
                    <h1>Multiplayer Crossword</h1>
                    
                    <p class="description">Collaborate with others to solve crosswords in real-time. Create a session and share the link with friends to play together!</p>
                    
                    ${this._error ? html`<div class="error">${this._error}</div>` : ''}

                    <div class="form-group">
                        <label for="language">Language:</label>
                        <select id="language" @change="${this._onLanguageChange}">
                            ${this._sessionProperties.supported_languages.map(lang => 
                                html`<option value="${lang}" ?selected="${lang === this._selectedLanguage}">${lang.toUpperCase()}</option>`
                            )}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="board-size">Board Size:</label>
                        <select id="board-size" @change="${this._onBoardSizeChange}">
                            ${Object.entries(this._sessionProperties.board_size_presets || {}).map(([name, dimensions]) =>
                                html`<option value="${name}" ?selected="${name === this._selectedBoardSize}">${name} (${dimensions[0]}×${dimensions[1]})</option>`
                            )}
                        </select>
                    </div>

                    <button @click="${this._onCreateCrossword}">Create Crossword</button>

                    <div class="data-info">
                        <span class="data-info-toggle" @click="${this._toggleDataInfo}">📋 Data & Privacy</span>
                        <div class="data-info-details" style="display: none;">
                            <ul>
                                <li><strong>Shared Data:</strong> Only the letters you type into the grid during a session are shared with other users and the backend server in that session.</li>
                                <li><strong>Session Lifetime:</strong> Sessions are automatically deleted after 48 hours of inactivity.</li>
                                <li><strong>No Tracking:</strong> No personal data is collected or stored beyond the session duration.</li>
                            </ul>
                            
                        </div>
                    </div>
                    <p style="margin-top: 12px; font-size: 0.9em;">
                        
                        <a href="https://the-cake-is-a-lie.net/gitea/jonas/multiplayer_crosswords" target="_blank" rel="noopener noreferrer">🔗 View source code on Gitea</a>
                    </p>
                </div>
            </div>
        `;
    }
}

customElements.define('crossword-menu', CrosswordMenu);
