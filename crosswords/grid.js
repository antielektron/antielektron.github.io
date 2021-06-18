import { html, css, LitElement, unsafeCSS } from 'https://unpkg.com/lit-element/lit-element.js?module';
import './infoBox.js'

const gridType = {
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
    }

    update(props) {
        super.update();
        if (props.has("grid_id")) {
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
            input[type='text'] {
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
                background-color: LightYellow;
                border-color: Yellow;

            }

            input[type='text']:read-only {
                background-color: LightGreen;
            }

            input[type='text']:selection {
                background: transparent;
            }
        `;
    }

    static get properties() {
        return {
            letter: { type: String },
            x: { type: Number },
            y: { type: Number },
            grid_id: { type: String }
        }
    }

    constructor() {
        super();
        this._value = '';
        this.is_focused = false;
        this.key_delay = false;
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
            this.value = str.slice(0);
            e.target.value = this.value
            e.handled = true;
        }

        if (!e.handled && this.value === " ") {
            this.value = "";
            e.target.value = "";
            e.handled = true;
        }

        if (!e.handled && this.value.length === 0) {
            this.crosswordGrid.focusPrevCell(this.x, this.y);
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
            this.crosswordGrid.sendMessage({
                'type': 'update',
                'x': this.x,
                'y': this.y,
                'letter': this.value
            })
        }

        if (!e.handled){

            e.target.select();

            e.handled = true;
        }

    }

    onKeydown(e) {

        if (!this.is_focused) {
            return;
        }

        this.key_delay = false;

        var key = e.key;

        console.log(key);


        if (this.value.length == 0) {
            if (key === 'Backspace' || key === 'Delete') {
                this.crosswordGrid.focusPrevCell(this.x, this.y);
                e.handled = true;
                return

            }
        }

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
        this.key_delay = true;

        this.crosswordGrid.updateHints(this.x, this.y);
    }

    focus() {
        var element = this.shadowRoot.getElementById(`${this.x}-${this.y}`);
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
        }
    }

    updateLetter(letter, revealed) {
        this.value = letter;
        if (revealed)
        {
            console.log("rec")
            this.shadowRoot.getElementById(`${this.x}-${this.y}`).readOnly = true;
            this.blur();
            this.revealed = true;
        }
    }

    render() {
        this.updateGridElement();
        return html`<input type="text" id="${this.x}-${this.y}" value="${this.value}" @input=${this.onInput} @focus=${this.onFocus} @keydown=${this.onKeydown} autocomplete="off"></input>`;
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

export class CrosswordGrid extends LitElement {
    static get styles() {
        return css`
            body {
                background-color: black;
            }

            table {
                position: relative;
                top: 5em;
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
            id: { type: String },
            width: { type: Number },
            height: { type: Number },
            infobox_id: {type: String}
        }
    }

    constructor() {
        super();
        this.width = 10;
        this.height = 10;
        this.grid = [];

        this.json_grid = null;

        this.num_hints = 0;

        this.lastMoveVertical = false;

        this.infobox = null;

        this.serverConnection = null;
    }

    createGridByJson(json_grid) {
        this.num_hints = 0;
        this.json_grid = json_grid;
        this.grid = [];
        const width = json_grid.w;
        const height = json_grid.h;

        var y;
        var x;

        for (y = 0; y < height; y++) {
            var row = [];
            for (x = 0; x < width; x++) {
                const json_cell = json_grid.grid[y][x];
                const cell_type = json_cell.cell_type;

                switch (cell_type) {
                    case "empty": {
                        row.push(new GridElement(x, y, this, gridType.EMPTY));
                        break;
                    }
                    case "hint": {
                        row.push(new GridElement(x, y, this, gridType.HINT));
                        break;
                    }
                    case "letter": {
                        row.push(new GridElement(x, y, this, gridType.LETTER));
                        break;
                    }

                };
            }
            this.grid.push(row);
        }

        this.width = width;
        this.height = height;
    }

    focusNextCellHorizontal(x, y) {
        if (x + 1 < this.width && this.grid[y][x + 1].getGridType() === gridType.LETTER) {
            if (this.grid[y][x].getGridType() === gridType.LETTER) {
                this.grid[y][x].getGridLetter().blur();
            }
            this.grid[y][x + 1].getGridLetter().focus();


            return true;
        }

        return false;
    }

    focusPrevCellHorizontal(x, y) {
        if (x - 1 >= 0 && this.grid[y][x - 1].getGridType() === gridType.LETTER) {
            if (this.grid[y][x].getGridType() === gridType.LETTER) {
                this.grid[y][x].getGridLetter().blur();
            }
            this.grid[y][x - 1].getGridLetter().focus();


            return true;
        }

        return false;
    }

    focusNextCellVertical(x, y) {
        if (y + 1 < this.height && this.grid[y + 1][x].getGridType() === gridType.LETTER) {
            if (this.grid[y][x].getGridType() === gridType.LETTER) {
                this.grid[y][x].getGridLetter().blur();
            }
            this.grid[y + 1][x].getGridLetter().focus();

            return true;
        }

        return false;
    }

    focusPrevCellVertical(x, y) {
        if (y - 1 >= 0 && this.grid[y - 1][x].getGridType() === gridType.LETTER) {
            if (this.grid[y][x].getGridType() === gridType.LETTER) {
                this.grid[y][x].getGridLetter().blur();
            }
            this.grid[y - 1][x].getGridLetter().focus();


            return true;
        }

        return false;
    }

    focusNextCell(x, y) {
        if (this.lastMoveVertical) {
            if (this.focusNextCellVertical(x, y)) {
                return;
            }
            if (this.focusNextCellHorizontal(x, y)) {
                this.lastMoveVertical = false;
            }
        }
        else {
            if (this.focusNextCellHorizontal(x, y)) {
                return;
            }
            if (this.focusNextCellVertical(x, y)) {
                this.lastMoveVertical = true;
            }
        }
    }

    focusPrevCell(x, y) {
        if (this.lastMoveVertical) {
            if (this.focusPrevCellVertical(x, y)) {
                return;
            }
            if (this.focusPrevCellHorizontal(x, y)) {
                this.lastMoveVertical = false;
            }
        }
        else {
            if (this.focusPrevCellHorizontal(x, y)) {
                return;
            }
            if (this.focusPrevCellVertical(x, y)) {
                this.lastMoveVertical = true;
            }
        }
    }

    getGridElement(x, y) {
        return this.grid[y][x];
    }

    update(props) {
        if (props.has("width") || props.has("height")) {
            //
        }
        if (props.has("infobox_id")) {
            this.infobox = document.getElementById(this.infobox_id);
        }
        super.update()
    }

    updateHints(x,y) {
        var cell = this.grid[y][x];
        if (cell.getGridType() != gridType.LETTER){
            console.error("cannot get hints for non letter cell");
        }

        //get horizontal hint:
        var upper_end = cell;
        while (upper_end.getGridType() === gridType.LETTER) {
            upper_end = this.grid[upper_end.y - 1][x]
        }

        var left_end = cell;
        while (left_end.getGridType() === gridType.LETTER) {
            left_end = this.grid[y][left_end.x - 1]
        }

        var hHint = "";
        var vHint = "";

        if (left_end.getGridType() === gridType.HINT) {
            var box = left_end.getHintBox();
            if (box.hasHorizontalHint()){
                hHint = `${box.hint_id}: ${box.horizontal_hint}`;
            }
        }

        if (upper_end.getGridType() === gridType.HINT) {
            var box = upper_end.getHintBox()
            if (box.hasVerticalHint())
            {
                vHint = `${box.hint_id}: ${box.vertical_hint}`;
            }
        }

        this.infobox.horizontal_hint = hHint;
        this.infobox.vertical_hint = vHint;
    }

    renderCell(el) {
        switch (el.type) {
            case gridType.LETTER: {
                return html`<grid-letter grid_id='${this.id}' x='${el.x}' y='${el.y}' ></grid-letter>`;

            }
            case gridType.EMPTY: {
                return html`<grid-box grid_id='${this.id}' x='${el.x}' y='${el.y}' ></grid-box>`;

            }
            case gridType.HINT: {
                var vertical_hint = this.json_grid.grid[el.y][el.x].vertical_hint;
                var horizontal_hint = this.json_grid.grid[el.y][el.x].horizontal_hint;

                if (!vertical_hint){
                    vertical_hint = "";
                }
                if (!horizontal_hint){
                    horizontal_hint = "";
                }

                this.num_hints += 1;

                return html`
                    <hint-box grid_id='${this.id}' x='${el.x}' y='${el.y}' horizontal_hint='${horizontal_hint}' vertical_hint='${vertical_hint}' hint_id=${this.num_hints}></hint-box>
                `;

            }
        }
    }

    updateLetter(x,y,letter,revealed) {
        var cell = this.grid[y][x];
        if (cell.getGridType() != gridType.LETTER){
            console.error("received bad message");
        }
        cell.getGridLetter().updateLetter(letter, revealed)
    }

    registerServerConnection(connection){
        this.serverConnection = connection
    }

    sendMessage(msg){
        if (!this.serverConnection) {
            console.error("no server connection registered")
        }
        this.serverConnection.sendMessage(msg)
    }

    render() {
        this.num_hints = 0;
        console.log("refreshing grid");
        return html`
            <table>
                ${this.grid.map((row) => html`<tr>${row.map((el) => html`<td>${this.renderCell(el)}</td>`)}</tr>`)}
            </table>
        `;
    }
}

customElements.define('crossword-grid', CrosswordGrid);