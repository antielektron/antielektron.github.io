import { html, css, LitElement, unsafeCSS } from 'https://unpkg.com/lit-element/lit-element.js?module';
import './infoBox.js'

export const gridType = {
    EMPTY: 0,
    HINT: 1,
    LETTER: 2
};

export class GridElement {
    constructor(x, y, grid, type) {
        this.x = x;
        this.y = y;
        this.type = type
        this.grid = grid;


        this.gridLetter = null;
        this.hintBox = null;
        this.emptyBox = null;
    }

    setGridLetter(gridLetter) {
        this.gridLetter = gridLetter;
    }

    getGridLetter() {
        return this.gridLetter;
    }

    setHintBox(hintBox) {
        this.hintBox = hintBox;
    }

    getHintBox() {
        return this.hintBox;
    }

    setEmptyBox(emptyBox) {
        this.emptyBox = emptyBox;
    }

    getEmptyBox() {
        return this.emptyBox;
    }

    getGridType() {
        return this.type;
    }

}

export class GridBox extends LitElement {
    static get styles() {
        return css`
            input[type='text'] {
                width: 1.5em;
                height: 1.5em;
                text-align: center;
                border-style: solid;
                border-color: black;
                border-width: 0.2 em;
                background-color: black;
                outline: none;
                color: transparent;
                text-shadow: 0 0 1 black;
                font-size: 2em;
                user-select: none;
                text-transform: uppercase;
            }
        `;
    }

    static get properties() {
        return {
            x: { type: Number },
            y: { type: Number },
            gridCount: {type: Number},
            grid_id: { type: String }
        }
    }

    constructor() {
        super();
        this.x = 0;
        this.y = 0;
        this.gridElement = null;
        this.grid_id = null;
        this.crosswordGrid = null;
        this.isRevealed = false;
        this.gridCount = 0;
    }

    update(props) {
        super.update(props);
        if (props.has("grid_id") || props.has("gridCount")) {
            this.updateGridElement();
        }
    }

    updateGridElement() {
        if (this.grid_id != null) {

            this.crosswordGrid = document.getElementById(this.grid_id);
            this.gridElement = this.crosswordGrid.getGridElement(this.x, this.y);
            this.gridElement.setEmptyBox(this);
        }
    }

    render() {
        return html`<input type="text" id="${this.x}-${this.y}" maxlength="1" value="" disabled></input>`;
    }
}

customElements.define('grid-box', GridBox);


export class GridLetter extends GridBox {
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

            input[type='text']:focus {
                grid-column: 1;
                grid-row: 1;
                background-color: LightYellow;
                border-color: Yellow;

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
                border: 0.1em solid grey;
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
            letter: { type: String },
            x: { type: Number },
            y: { type: Number },
            gridCount: {type: Number},
            grid_id: { type: String }
        }
    }

    constructor() {
        super();
        this._value = '';
        this.is_focused = false;
        this.firstKeydownOver = true;
        this.solutionIndex = -1;
        this.lastFocusedX = -1;
        this.lastFocusedY = -1;
        this.updateGridElement();
    }



    set value(value) {
        const oldValue = this.value;
        console.log("update value to: " + value);

        this._value = value;
        this.requestUpdate('value', oldValue);
    }

    get value() {
        return this._value;
    }

    onInput(e) {


        if (!this.is_focused) {
            e.handled = true;
            return;
        }

        //if (this.key_delay){
        //    var el = this.shadowRoot.getElementById(`${this.x}-${this.y}`);
        //    el.value = this.value;
        //    el.select();
        //    e.handled = true;
        //    return;
        //}

        var oldVal = this.value;
        this.value = e.target.value

        if (this.revealed) {
            this.value = oldVal;
            this.crosswordGrid.focusNextCell(this.x, this.y);
            return
        }

        if (this.value.length > 1) {
            this.value = this.value[0];
            e.target.value = this.value
            e.handled = true;
        }

        if (!e.handled && this.value === " ") {
            this.value = "";
            e.target.value = "";
            e.handled = true;
        }

        if (!e.handled && this.value.length === 0) {
            this.crosswordGrid.focusPrevCell(this.x, this.y, this.lastFocusedX, this.lastFocusedY);
            e.handled = true;
        }
        else if (!e.handled && this.value.length === 1) {
            this.crosswordGrid.focusNextCell(this.x, this.y);
            e.handled = true;
        }
        else {
            this.focus();
        }

        if (oldVal != this.value) {
            if (this.solutionIndex >= 0) {
                this.crosswordGrid.setSolutionLetter(this.solutionIndex, this.value);

            }
            this.crosswordGrid.sendMessage({
                'type': 'update',
                'x': this.x,
                'y': this.y,
                'letter': this.value
            })
        }

        if (!e.handled) {

            e.target.select();

            e.handled = true;
        }

    }

    onKeyup(e) {
        if (!this.firstKeydownOver) {
            e.handled = true;
            return;
        }

        var key = e.key;
        if (this.value.length == 0 || this.revealed) {
            if (key === 'Backspace' || key === 'Delete') {
                this.crosswordGrid.focusPrevCell(this.x, this.y, this.lastFocusedX, this.lastFocus);
                e.handled = true;
                return

            }
            else if (this.revealed) {
                this.crosswordGrid.focusNextCell(this.x, this.y);
                e.handled = true;
                return
            }
        }
    }

    onKeydown(e) {

        this.firstKeydownOver = true;

        if (!this.is_focused) {
            e.handled = true;
            return;
        }


        var key = e.key;

        console.log(key);


        // check arrow keys
        if (key === "ArrowLeft") {
            // left
            this.crosswordGrid.focusPrevCellHorizontal(this.x, this.y);
            e.handled = true;
            return;
        }
        else if (key === "ArrowUp") {
            // up
            this.crosswordGrid.focusPrevCellVertical(this.x, this.y);
            e.handled = true;
            return;

        }
        else if (key === "ArrowRight") {
            //right
            this.crosswordGrid.focusNextCellHorizontal(this.x, this.y);
            e.handled = true;
            return;
        }
        else if (key === "ArrowDown") {
            //down
            this.crosswordGrid.focusNextCellVertical(this.x, this.y);
            e.handled = true;
            return;
        }



        e.target.select();


    }

    onFocus(e) {
        e.target.select();
        this.is_focused = true;

        this.crosswordGrid.updateHints(this.x, this.y);
    }

    focus(lastX = -1, lastY = -1) {
        if (lastX > 0 && lastY > 0) {
            this.lastFocusedX = lastX;
            this.lastFocusedY = lastY;
        }
        var element = this.shadowRoot.getElementById(`${this.x}-${this.y}`);
        this.firstKeydownOver = false;
        element.focus();


    }

    blur() {
        var element = this.shadowRoot.getElementById(`${this.x}-${this.y}`);
        element.blur();
        this.is_focused = false;
    }

    updateGridElement() {
        super.updateGridElement()

        if (this.grid_id != null) {

            this.gridElement.setGridLetter(this);
            this.solutionIndex = this.crosswordGrid.getSolutionIndex(this.x, this.y)
        }
    }

    updateLetter(letter, revealed) {
        this.value = letter;
        var element = this.shadowRoot.getElementById(`${this.x}-${this.y}`);
        element.value = letter;
        if (revealed) {
            console.log("rec")
            this.shadowRoot.getElementById(`${this.x}-${this.y}`).readOnly = true;
            this.blur();
            this.revealed = true;
        }
    }

    render() {
        this.updateGridElement();

        var solutionOverlay = html``;

        if (this.solutionIndex >= 0) {
            solutionOverlay = html`
                <div class="circle">${this.solutionIndex + 1}</div>
            `;
        }



        return html`
            <div class="letter">
                <input type="text" id="${this.x}-${this.y}" value="${this.value}" @input=${this.onInput} @focus=${this.onFocus} @keydown=${this.onKeydown} @keyup=${this.onKeyup} autocomplete="off"></input>
                ${solutionOverlay}
            </div>

        `;

    }
}

customElements.define('grid-letter', GridLetter);



export class HintBox extends GridBox {

    static get styles() {

        return css`

            .hint {
                display: grid;
            }
            

            .triangle-down {
                position: relative;
                top: 3em;
                left: 1em;
                z-index: 10;
                grid-column: 1;
                grid-row: 1;
                width: 0;
                height: 0;
                border-left: 0.75em solid transparent;
                border-right: 0.75em solid transparent;
                border-top: 1.3em solid #555;
                
            }

            .triangle-right {
                position: relative;
                top: 1em;
                left: 3em;
                z-index: 10;
                grid-column: 1;
                grid-row: 1;
                width: 0;
                height: 0;
                border-top: 0.75em solid transparent;
                border-bottom: 0.75em solid transparent;
                border-left: 1.3em solid #555;
                
            }

            input[type='text']{
                grid-column: 1;
                grid-row: 1;
                width: 1.5em;
                height: 1.5em;
                text-align: center;
                border-style: solid;
                border-color: black;
                border-width: 0.2 em;
                background-color: #555;
                outline: none;
                color: white;
                text-shadow: 0 0 1 black;
                font-size: 2em;
                user-select: none;
                text-transform: uppercase;
            }
        `;
    }

    static get properties() {
        return {
            x: { type: Number },
            y: { type: Number },
            grid_id: { type: String },
            horizontal_hint: { type: String },
            vertical_hint: { type: String },
            gridCount: {type: Number},
            hint_id: { type: String }
        }
    }

    constructor() {
        super();
        this.vertical_hint = "";
        this.horizontal_hint = "";
        this.hint_id = 0;

    }



    getVerticalHint() {
        return this.vertical_hint;
    }

    getHorizontalHint() {
        return this.horizontal_hint;
    }

    hasVerticalHint() {
        return this.vertical_hint.length > 0;
    }

    hasHorizontalHint() {
        return this.horizontal_hint.length > 0;
    }

    updateGridElement() {
        super.updateGridElement()

        if (this.grid_id != null) {

            this.gridElement.setHintBox(this);
        }
    }

    render() {

        this.updateGridElement();

        var verticalArrow = html``;
        var horizontalArrow = html``;

        if (this.hasVerticalHint()) {
            verticalArrow = html`<div class="triangle-down"></div>`;
        }

        if (this.hasHorizontalHint()) {
            horizontalArrow = html`<div class="triangle-right"></div>`;
        }

        return html`
        <div class="hint">
            <input type="text" id="${this.x}-${this.y}" value="${this.hint_id}" disabled></input>
            ${verticalArrow}
            ${horizontalArrow}
        </div>
        `;
    }
}

customElements.define('hint-box', HintBox);
