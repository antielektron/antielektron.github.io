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
            _selectedBoardSize: { state: true },
            _saveSessionsEnabled: { state: true },
            _savedSessions: { state: true }
        };
    }

    constructor() {
        super();
        this._loading = true;
        this._error = null;
        this._sessionProperties = null;
        this._selectedLanguage = '';
        this._selectedBoardSize = '';
        this._saveSessionsEnabled = false;
        this._savedSessions = [];
        this._initializeSessionStorage();
    }

    connectedCallback() {
        super.connectedCallback();
        // Register notification manager with WebSocket
        wsManager.setNotificationManager(notificationManager);
        // Listen for session creation/subscription events
        wsManager.onMessage('session_created', (msg) => this._onSessionCreated(msg));
        wsManager.onMessage('full_session_state', (msg) => this._onSessionJoined(msg));
        wsManager.onMessage('error', (msg) => this._onSessionError(msg));
        this._initializeConnection();
        
        // Make update function available globally
        window.updateSessionCompletionRatio = (sessionId, completionRatio) => {
            this._updateSessionCompletionRatio(sessionId, completionRatio);
        };
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Remove message handlers
        wsManager.offMessage('available_session_properties', this._handleSessionProperties);
        wsManager.offMessage('error', this._handleError);
        wsManager.offMessage('session_created', this._onSessionCreated);
        wsManager.offMessage('full_session_state', this._onSessionJoined);
        wsManager.offMessage('error', this._onSessionError);
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
        const host = window.location.hostname;
        
        // Special case for GitHub Pages deployment
        if (host === 'antielektron.github.io') {
            return 'wss://the-cake-is-a-lie.net/crosswords_backend/';
        }
        
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        
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
        notificationManager.success('Connected to Crossword server');
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

    // Session storage management
    _initializeSessionStorage() {
        // Check if the save setting is enabled
        const saveSettingEnabled = this._getCookie('saveSessionsEnabled');
        if (saveSettingEnabled === 'true') {
            this._saveSessionsEnabled = true;
            
            // Load saved sessions if the setting is enabled
            const savedSessionsData = this._getCookie('savedSessions');
            if (savedSessionsData) {
                try {
                    this._savedSessions = JSON.parse(savedSessionsData);
                    
                    // Ensure all sessions have a completionRatio field (for backward compatibility)
                    this._savedSessions = this._savedSessions.map(session => ({
                        ...session,
                        completionRatio: session.completionRatio || 0
                    }));
                } catch (e) {
                    console.warn('Failed to parse saved sessions cookie:', e);
                    this._clearAllCookies();
                }
            }
        }
    }

    _getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    _setCookie(name, value, days = 30) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    _deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }

    _clearAllCookies() {
        this._deleteCookie('savedSessions');
        this._deleteCookie('saveSessionsEnabled');
        this._savedSessions = [];
        this._saveSessionsEnabled = false;
        this.requestUpdate();
    }

    _clearSessionsOnly() {
        this._deleteCookie('savedSessions');
        this._savedSessions = [];
        this.requestUpdate();
    }

    _toggleSessionSaving() {
        this._saveSessionsEnabled = !this._saveSessionsEnabled;
        if (this._saveSessionsEnabled) {
            // Save the setting preference when enabled
            this._setCookie('saveSessionsEnabled', 'true');
        } else {
            // Clear everything when disabled
            this._clearAllCookies();
        }
        this.requestUpdate();
    }

    _saveSession(sessionId, sessionInfo = {}) {
        if (!this._saveSessionsEnabled) return;
        
        // Remove existing entry for this session
        this._savedSessions = this._savedSessions.filter(s => s.id !== sessionId);
        
        // Add new entry
        this._savedSessions.unshift({
            id: sessionId,
            timestamp: Date.now(),
            completionRatio: 0, // Default completion ratio
            ...sessionInfo
        });
        
        // Keep only last 10 sessions
        this._savedSessions = this._savedSessions.slice(0, 10);
        
        // Save to cookie
        this._setCookie('savedSessions', JSON.stringify(this._savedSessions));
        this.requestUpdate();
    }

    _updateSessionCompletionRatio(sessionId, completionRatio) {
        if (!this._saveSessionsEnabled) return;
        
        // Find and update the session
        const sessionIndex = this._savedSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            this._savedSessions[sessionIndex].completionRatio = completionRatio;
            this._savedSessions[sessionIndex].timestamp = Date.now(); // Update timestamp
            
            // Save updated sessions to cookie
            this._setCookie('savedSessions', JSON.stringify(this._savedSessions));
            this.requestUpdate();
        }
    }

    _removeSession(sessionId) {
        this._savedSessions = this._savedSessions.filter(s => s.id !== sessionId);
        if (this._savedSessions.length === 0) {
            this._clearSessionsOnly();
        } else {
            this._setCookie('savedSessions', JSON.stringify(this._savedSessions));
        }
        this.requestUpdate();
    }

    _onSessionCreated(message) {
        if (message.session_id) {
            this._saveSession(message.session_id, {
                type: 'created',
                language: this._selectedLanguage,
                boardSize: this._selectedBoardSize
            });
        }
    }

    _onSessionJoined(message) {
        if (message.session_id) {
            this._saveSession(message.session_id, {
                type: 'joined'
            });
        }
    }

    _onSessionError(message) {
        // Check if it's a session not found error
        if (message.error_message && message.error_message.includes('session') && message.error_message.includes('not found')) {
            // Try to extract session ID from error message or use current session ID
            // This is a fallback - we might not always have the exact session ID in error messages
            const sessionIdMatch = message.error_message.match(/session\s+([a-f0-9-]+)/i);
            if (sessionIdMatch) {
                const sessionId = sessionIdMatch[1];
                this._removeSession(sessionId);
                notificationManager.warning(`Session ${sessionId.substring(0, 8)}... no longer exists and was removed from saved sessions`);
            }
        }
    }

    _reconnectToSession(sessionId) {
        // Update the timestamp to move this session to the top
        this._saveSession(sessionId, { type: 'rejoined' });
        
        // Use the global subscribeToSession function to properly set currentSessionId
        if (window.subscribeToSession) {
            window.subscribeToSession(sessionId);
        } else {
            // Fallback if function not available
            const message = {
                type: 'subscribe_session',
                session_id: sessionId
            };
            wsManager.send(message);
            notificationManager.info('Reconnecting to session...');
        }
    }

    _clearSavedSessions() {
        this._clearSessionsOnly();
        notificationManager.info('All saved sessions cleared');
    }

    _formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((now - date) / (1000 * 60));
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
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

                    <div class="form-group">
                        <label>
                            <input type="checkbox" ?checked="${this._saveSessionsEnabled}" @change="${this._toggleSessionSaving}">
                            Save list of recently joined sessions (uses cookies)
                        </label>
                    </div>

                    <button @click="${this._onCreateCrossword}">Create Crossword</button>

                    ${this._savedSessions.length > 0 ? html`
                        <div class="saved-sessions">
                            <h3>Recent Sessions</h3>
                            <div class="session-list">
                                ${this._savedSessions.map(session => html`
                                    <div class="session-item">
                                        <div class="session-info">
                                            <span class="session-id">${session.id.substring(0, 8)}...</span>
                                            <span class="session-time">${this._formatTimestamp(session.timestamp)}</span>
                                            ${session.language ? html`<span class="session-lang">${session.language.toUpperCase()}</span>` : ''}
                                            <span class="session-completion">${session.completionRatio || 0}% solved</span>
                                        </div>
                                        <div class="session-actions">
                                            <button class="reconnect-btn" @click="${() => this._reconnectToSession(session.id)}">Rejoin</button>
                                            <button class="remove-btn" @click="${() => this._removeSession(session.id)}">×</button>
                                        </div>
                                    </div>
                                `)}
                            </div>
                            <button class="clear-all-btn" @click="${this._clearSavedSessions}">Clear All Sessions</button>
                        </div>
                    ` : ''}

                    <div class="data-info">
                        <span class="data-info-toggle" @click="${this._toggleDataInfo}">▶ 📋 Data Usage for the Multiplayer functionality</span>
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
