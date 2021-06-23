import { html, css, LitElement, unsafeCSS } from 'https://unpkg.com/lit-element/lit-element.js?module';

export class SolutionBox extends LitElement {
    static get styles() {
        return css`
            .letter {
                display: grid;
            }

            input[type='text'] {
                grid-column: 1;
                grid-row: 1;
                width: 1.5em;
                height: 1.5em;
                text-align: center;
                border-style: solid;
                border-width: 0.2 em;
                border-color: black;
                outline: none;
                color: black;
                font-size: 2em;
                user-select: none;
                text-transform: capitalize;
            }

            input[type='text']:read-only {
                grid-column: 1;
                grid-row: 1;
                background-color: LightGreen;
            }

            input[type='text']:selection {
                grid-column: 1;
                grid-row: 1;
                background: transparent;
            }

            .circle {
                margin: auto;
                text-align: left;
                vertical-align: bottom;
                bottom: 0;
                position: relative;
                z-index: 0;
                pointer-events: none;
                grid-column: 1;
                grid-row: 1;
                border: 0.1em solid lightGray;
                color: black;
                height: 80%;
                width: 80%;
                border-radius:50%;
                -moz-border-radius:50%;
                -webkit-border-radius:50%;
                background: transparent;
                
            }

        `;

    }

    static get properties() {
        return {
            length: { type: Number }
        };
    }

    constructor() {
        super();
        this.length = 0;
        this.values = [];
    }

    update(props) {
        if (props.has("length")) {
            var i;
            for (i = 0; i < this.length; i++) {
                this.values.push("");
            }
        }
        super.update()
    }

    render() {
        return html`

        `;
    }
}