import { html, css, LitElement, unsafeCSS } from 'https://unpkg.com/lit-element/lit-element.js?module';

export class InfoBox extends LitElement {
    static get styles() {
        return css`
            .hinttext {
                color: white;
                margin-left: 1em;
                margin-top: 0.8em;
                

            }

            .infobox {
                z-index: 20;
                position: fixed;
                top: 0em;
                left: 0em;
                right: 0em;
                height: 6em;

                border-style: solid;
                border-color: white;
                border-width: 0.2 em;
                background-color: #333;
                color: white;
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

    render() {
        return html`
            <div class="infobox">
                <div class="hinttext">▶ ${this.horizontal_hint}</div>
                <div class="hinttext">▼ ${this.vertical_hint}</div>
            </div>
        `;
    }

}

customElements.define('info-box', InfoBox);
