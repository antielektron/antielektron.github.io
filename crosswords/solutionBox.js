import { html, css, LitElement, unsafeCSS } from 'https://unpkg.com/lit-element/lit-element.js?module';
import { GridLetter } from './gridBoxes.js';

export class SolutionLetter extends LitElement {
    static get styles() {
        return GridLetter.styles;
    }

    static get properties() {
        return {
            solutionIndex: { type: Number },
            grid_id: { type: String }
        };
    }

    constructor() {
        super();
        this._letter = "";
        this.solutionIndex = 0;
        this.grid_id = "";
        this.grid = null;
        this.revealed = false;
    }

    update(props) {
        if (props.has("grid_id")) {
            this.grid = document.getElementById(this.grid_id);
        }

        super.update(props);

    }

    reveal(letter) {
        var el = this.shadowRoot.getElementById("solution" + this.solutionIndex);
        this.letter = letter;
        el.readOnly = true;
        this.revealed = true;

    }

    set letter(letter) {
        this._letter = letter
        var e = this.shadowRoot.getElementById("solution" + this.solutionIndex);
        if (e.value != this.letter)
            e.value = this.letter

    }

    get letter(){
        return this._letter;
    }

    onFocus(e) {
        e.target.select();
    }


    onInput(e) {

        if (this.revealed) {
            e.handled = true;
            return;
        }

        var val = e.target.value;

        var el = this.shadowRoot.getElementById("solution" + this.solutionIndex);

        if (val.length > 1) {
            val = val[0];
            

        }
        if (e.target.value != this.letter){
            
            this.letter = val;
            this.grid.setSolutionLetter(this.solutionIndex, this.letter);
        }
        e.target.select();
        e.handled = true;


    }

    render() {
        console.log("render solution letter");
        return html`
            <div class="letter">
                <input type="text" id="solution${this.solutionIndex}" value="${this.letter}" @input=${this.onInput} @focus=${this.onFocus} autocomplete="off"></input>
                <div class="circle">${this.solutionIndex + 1}</div>
            </div>
        `;
    }
}

customElements.define('solution-letter', SolutionLetter);

export class SolutionBox extends LitElement {
    static get styles() {
        return css`
        body {
            background-color: black;
        }

        .codewordlabel {
            z-index: 5;
            position: relative;
            top: 5em;
            font-size: 1.5em;
            color: white;
            text-color: white;
        }

        table {
            position: relative;
            top: 7em;
            border-spacing: 0px;
            border-style: solid;
            border-color: black;
            border-width: 1em;
        }

        td {
            padding: 0px;
        }
        `;
    }

    static get properties() {
        return {
            length: { type: Number },
            grid_id: { type: String }
        };
    }

    constructor() {
        super();
        this.length = 0;
        this.values = []
        this.grid_id = "";
        this.grid = null;
    }

    update(props) {
        console.log("update colution, grid is " + this.grid_id);
        if (this.grid_id.length > 0) {
            this.grid = document.getElementById(this.grid_id);
            this.grid.setSolutionBox(this);
            console.log("updated grid parent");

            this.values = [];
            var i;
            for (i = 0; i < this.length; i++) {
                this.values.push("");
            }
            this.requestUpdate();
            console.log("update length");
        }
        super.update(props);
    }

    setLetter(solutionIndex, letter, revealed = false) {
        var solutionBox = this.shadowRoot.getElementById("solutionLetter" + solutionIndex)
        solutionBox.letter = letter;

        if (revealed) {
            solutionBox.reveal(letter);
        }
    }

    render() {
        console.log("rerender box");
        return html`
            <div class="codewordlabel">Codeword</div>
            <table><tr>
                    ${this.values.map((el, i) => html`<td><solution-letter id="solutionLetter${i}" grid_id=${this.grid_id} letter="" solutionIndex=${i} ></solution-letter></td>`)}
            </tr></table>
        `;
    }
}

customElements.define('solution-box', SolutionBox);
