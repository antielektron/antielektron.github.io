import { html, css, LitElement, unsafeCSS } from 'https://unpkg.com/lit-element/lit-element.js?module';
import './infoBox.js'
import {GridElement, GridLetter, GridBox, gridType} from './gridBoxes.js'
import './solutionBox.js'

export class CrosswordGrid extends LitElement {
    static get styles() {
        return css`
            body {
                background-color: black;
                text-align: center;
                
            }

            table {
                position: relative;
                top: 7em;
                border-spacing: 0px;
                border-style: solid;
                border-color: black;
                border-width: 1em;
                text-align: center;
                margin-left: auto;
                margin-right: auto;
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
            infobox_id: { type: String }
        };
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

        this.solution_locations = [];

        this.solutionBox = null;

        this.gridCount = 0;
    }

    setSolutionBox(solBox) {
        this.solutionBox = solBox;
        if (self.solution_locations)
            solBox.length = self.solution_locations.length;
    }

    getSolutionIndex(x, y) {
        var i = 0;
        for (i = 0; i < this.solution_locations.length; i++) {
            if (this.solution_locations[i][0] == y && this.solution_locations[i][1] == x) {
                return i;
            }
        }
        return -1;
    }

    createGridByJson(json_grid) {
        this.num_hints = 0;
        this.json_grid = json_grid;
        this.grid = [];
        const width = json_grid.w;
        const height = json_grid.h;
        this.gridCount += 1;

        this.solution_locations = json_grid.solution

        if (this.solutionBox)
            this.solutionBox.length = this.solution_locations.length;
            this.solutionBox.requestUpdate();
            console.log("update box");

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

        this.requestUpdate();

        
    }

    focusNextCellHorizontal(x, y) {
        if (x + 1 < this.width && this.grid[y][x + 1].getGridType() === gridType.LETTER) {
            if (this.grid[y][x].getGridType() === gridType.LETTER) {
                this.grid[y][x].getGridLetter().blur();
            }
            this.grid[y][x + 1].getGridLetter().focus(x, y);


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
            this.grid[y + 1][x].getGridLetter().focus(x, y);

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

    focusPrevCell(x, y, lastX = -1, lastY = -1) {
        if (lastX > 0 && lastY > 0) {
            this.grid[lastY][lastX].getGridLetter().focus();
            return;
        }
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

    updateHints(x, y) {
        var cell = this.grid[y][x];
        if (cell.getGridType() != gridType.LETTER) {
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
            if (box.hasHorizontalHint()) {
                hHint = `${box.hint_id}: ${box.horizontal_hint}`;
            }
        }

        if (upper_end.getGridType() === gridType.HINT) {
            var box = upper_end.getHintBox()
            if (box.hasVerticalHint()) {
                vHint = `${box.hint_id}: ${box.vertical_hint}`;
            }
        }

        this.infobox.horizontal_hint = hHint;
        this.infobox.vertical_hint = vHint;
    }

    renderCell(el) {
        switch (el.type) {
            case gridType.LETTER: {
                return html`<grid-letter grid_id='${this.id}' gridCount='${this.gridCount}' x='${el.x}' y='${el.y}' ></grid-letter>`;

            }
            case gridType.EMPTY: {
                return html`<grid-box grid_id='${this.id}' gridCount='${this.gridCount}' x='${el.x}' y='${el.y}' ></grid-box>`;

            }
            case gridType.HINT: {
                var vertical_hint = this.json_grid.grid[el.y][el.x].vertical_hint;
                var horizontal_hint = this.json_grid.grid[el.y][el.x].horizontal_hint;

                if (!vertical_hint) {
                    vertical_hint = "";
                }
                if (!horizontal_hint) {
                    horizontal_hint = "";
                }

                this.num_hints += 1;

                return html`
                    <hint-box grid_id='${this.id}' gridCount='${this.gridCount}' x='${el.x}' y='${el.y}' horizontal_hint='${horizontal_hint}' vertical_hint='${vertical_hint}' hint_id=${this.num_hints}></hint-box>
                `;

            }
        }
    }

    updateLetter(x, y, letter, revealed) {
        var cell = this.grid[y][x];
        if (cell.getGridType() != gridType.LETTER) {
            console.error("received bad message");
        }
        cell.getGridLetter().updateLetter(letter, revealed)
        if (cell.getGridLetter().solutionIndex >= 0) {
            this.setSolutionLetter(
                cell.getGridLetter().solutionIndex,
                letter,
                revealed
            );
        }
    }

    registerServerConnection(connection) {
        this.serverConnection = connection
    }

    sendMessage(msg) {
        if (!this.serverConnection) {
            console.error("no server connection registered")
        }
        this.serverConnection.sendMessage(msg)
    }

    setSolutionLetter(solutionNumber, letter, revealed = false){
        this.solutionBox.setLetter(solutionNumber, letter, revealed);
        const x = this.solution_locations[solutionNumber][1];
        const y = this.solution_locations[solutionNumber][0];
        console.log("update solution letter");
        this.grid[y][x].getGridLetter().value = letter;

    }

    

    render() {
        this.num_hints = 0;
        console.log("refreshing grid");

        var solution_length = 0;
        if (this.solution_locations){
            solution_length = this.solution_locations.length;
        }


        return html`
            <table>
                ${this.grid.map((row) => html`<tr>${row.map((el) => html`<td>${this.renderCell(el)}</td>`)}</tr>`)}
            </table>
            <solution-box id="solution-box", grid_id="${this.id}", length="${solution_length}" ></solution-box>
        `;
    }
}

customElements.define('crossword-grid', CrosswordGrid);