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