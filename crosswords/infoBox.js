import { html, css, LitElement, unsafeCSS } from 'https://unpkg.com/lit-element/lit-element.js?module';
import { getCookie, setCookie } from './cookie.js';

function copyToClipboard(text) {
    var input = document.body.appendChild(document.createElement("input"));
    input.value = text;
    input.focus();
    input.select();
    document.execCommand('copy');
    input.parentNode.removeChild(input);
    alert("copied url to clipboard, you can share this link to work collaboratively on this puzzle in real time");
}

export class InfoBox extends LitElement {
    static get styles() {
        return css`
            .hinttext {
                color: white;
                margin-left: 1em;
                margin-top: 0.8em;
            }

            .hintbox {
                grid-column: 1;
                grid-row: 1;
            }

            .infobox {
                font-size = 1em;
                z-index: 20;
                position: fixed;
                display: grid;
                grid-template-columns: auto min-content;
                top: 0em;
                left: 0em;
                right: 0em;
                min-height: 8em;

                border-style: solid;
                border-color: white;
                border-width: 0.2 em;
                background-color: #333;
                color: white;
            }

            .buttonbox {
                grid-column: 2;
                grid-row: 1;
                padding: 0.3em;
            }

            .button {
                background-color: black;
                border-color: white;
                border-width: 0.2em;
                border-style: solid;
                min-width: 10em;
                min-height: 3.5em;
                box-shadow: none;
                outline: none;
                margin: 0.1em 0.1em;
                color: white;
                font-size: 1em;
            }

        `;
    }

    static get properties() {
        return {
            horizontal_hint: { type: String },
            vertical_hint: { type: String }
        };
    }

    constructor() {
        super();
        this.vertical_hint = "";
        this.horizontal_hint = "";
    }

    onNew() {
        setCookie("session", "");
        var crosswordRoot = location.pathname.substr(0, location.pathname.lastIndexOf("/")); 
        window.location.href = location.protocol + '//' + location.host + crosswordRoot;

    }

    onShare() {
        copyToClipboard(window.location.href);
    }

    render() {
        return html`
            <div class="infobox">
                <div class="hintbox">
                    <div class="hinttext">▶ ${this.horizontal_hint}</div>
                    <div class="hinttext">▼ ${this.vertical_hint}</div>
                </div>
                <div class="buttonbox">
                    <button class="button" @click=${this.onNew}> new Crossword </button>
                    <button class="button" @click=${this.onShare}> share </button>

                </div>
            </div>
        `;
    }

}

customElements.define('info-box', InfoBox);
