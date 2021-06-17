import { html, css, LitElement } from 'https://unpkg.com/lit-element/lit-element.js?module';

export class WebsocketConnection extends LitElement {
    static get styles() {
        return css``;
    }

    static get properties() {
        return {
            url: { type: String }
        }
    }

    constructor() {
        super();

        this.url = '';
        this.socket = null;
    }


    onopen(event){
        console.log("websocket connected");
    }

    onclose(event){
        console.log("websocket closed");
    }

    onerror(event){
        console.log("websocket error, closing...");
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close();
        }
    }

    onmessage(event){
        console.log("received message:", event.data);
    }

    isSocketConnected(){
        if (! this.socket){
            return false;
        }

        if (this.socket.readyState === WebSocket.OPEN) {
            return true;
        }
        return false;
    }

    sendMessage(msg){
        
        if (this.isSocketConnected()) {
            var string_msg = JSON.stringify(msg);
            this.socket.send(string_msg);
        }
        else {
            console.error("cannot send message, websocket disconnected");
        }

    }

    connect() {
        console.log(`connect to ${this.url}...`);
        this.socket = new WebSocket(this.url);
        this.socket.onopen = (event) => this.onopen(event);
        this.socket.onclose = (event) => this.onclose(event);
        this.socket.onerror = (event) => this.onerror(event);
        this.socket.onmessage = (event) => this.onmessage(event);
    }

    update(props) {
        if (props.has("url")){
            this.connect();
        }
        super.update(props);
    }



    render() {
        // do nothing
        return html``;
    }
}

customElements.define('websocket-connection', WebsocketConnection);

export class ServerConnection extends WebsocketConnection {
    static get styles() {
        return css``;
    }

    static get properties() {
        return {
            url: { type: String },
            grid_id: { type: String }
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
            'sessionId': this.sessionId
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
