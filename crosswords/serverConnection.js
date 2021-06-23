import { html, css, LitElement } from 'https://unpkg.com/lit-element/lit-element.js?module';
import { WebsocketConnection } from './websocket.js';
import { getCookie, setCookie } from './cookie.js';

export class ServerConnection extends WebsocketConnection {
    static get styles() {
        return css``;
    }

    static get properties() {
        return {
            url: { type: String },
            grid_id: { type: String },
            lang: { type: String }
        }
    }

    constructor() {
        super();
        this.sessionId = null;
        this.isRegistered = false;
        this.crossword_grid = null;

    }

    update(props) {
        if (props.has("grid_id")) {
            this.crossword_grid = document.getElementById(this.grid_id);
            this.crossword_grid.registerServerConnection(this);
        }
        super.update(props)
    }

    updateLocalSessionId() {
        // look whether the session id is given in url params
        // or stored as cookie
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        if (params.has('session')) {
            this.sessionId = params.get('session');
            return;
        }
        const cookie_session = getCookie('session');
        if (cookie_session != "") {
            this.sessionId = cookie_session;
            return;
        }

    }

    register() {
        this.updateLocalSessionId();
        console.log("register", this.sessionId);
        this.sendMessage({
            'type': 'register',
            'sessionId': this.sessionId,
            'lang': this.lang
        });
    }

    onopen(event) {
        super.onopen(event);
        console.log("overloaded", this);
        this.register();
    }

    handleRegistration(sessionId) {
        if (!sessionId) {
            console.warn("got undefined session id");
            return;
        }
        this.sessionId = sessionId;
        console.log("stored session", sessionId, "as cookie")
        setCookie("session", sessionId, 2);
        const urlparams = new URLSearchParams(window.location.search);
        if (urlparams.has('session') && this.sessionId === urlparams.get('session')){
            return;
        }
        urlparams.set('session', sessionId);
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?session=' + sessionId;
        window.history.pushState({ path: newurl }, '', newurl);

    }

    handleCrossword(crossword) {
        this.crossword_grid.createGridByJson(crossword);
    }

    handleUpdate(updates) {
        var i = 0;
        for (i = 0; i < updates.length; i++) {
            const item = updates[i];

            const x = item['x'];
            const y = item['y'];

            if (item.hasOwnProperty("user_input")) {
                const letter = item['user_input'];
                this.crossword_grid.updateLetter(x, y, letter, false);
            }
            if (item.hasOwnProperty("revealed")) {
                console.log("update");
                const letter = item['revealed'];
                this.crossword_grid.updateLetter(x, y, letter, true);
            }

        }
    }

    onmessage(event) {
        super.onmessage(event)
        try {
            const msg = JSON.parse(event.data);
            if (!msg.type) {
                throw "missing type"
            }
            switch (msg.type) {
                case 'register': {
                    this.handleRegistration(msg.sessionId);
                    break;
                }
                case 'crossword': {
                    this.handleCrossword(msg.crossword);
                    break;
                }
                case 'update': {
                    this.handleUpdate(msg.updates);
                    break
                }

            }

        }
        catch (err) {
            console.error("could not parse servermessage", err);
            return
        }

    }


}

customElements.define('server-connection', ServerConnection);