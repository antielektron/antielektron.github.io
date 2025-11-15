import { LitElement, html } from 'https://unpkg.com/lit-element/lit-element.js?module';

export class ClueArea extends LitElement {
    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            cluesAcross: { type: Object },
            cluesDown: { type: Object },
            cluePositionsAcross: { type: Object },
            cluePositionsDown: { type: Object },
            selectedRow: { type: Number },
            selectedCol: { type: Number },
            selectedMode: { type: String }, // 'horizontal' or 'vertical'
            grid: { type: Array }, // 2D grid from server (needed to find walls)
            gridData: { type: Object }, // { rows, cols, walls, solvedCells }
            _showAllCluesAcross: { state: true },
            _showAllCluesDown: { state: true },
            _solvedCluesAcross: { state: true }, // Set of solved clue numbers
            _solvedCluesDown: { state: true } // Set of solved clue numbers
        };
    }

    constructor() {
        super();
        this.cluesAcross = {};
        this.cluesDown = {};
        this.cluePositionsAcross = {};
        this.cluePositionsDown = {};
        this.selectedRow = 0;
        this.selectedCol = 0;
        this.selectedMode = 'horizontal';
        this.grid = [];
        this.gridData = { rows: 0, cols: 0, walls: new Set(), solvedCells: new Set() };
        this._showAllCluesAcross = false;
        this._showAllCluesDown = false;
        this._solvedCluesAcross = new Set();
        this._solvedCluesDown = new Set();
    }

    /**
     * Find a horizontal clue that contains the given cell
     * NOTE: Server sends positions as (x, y) = (col, row), NOT (row, col)!
     */
    _getCellAcrossClue(row, col) {
        console.log(`[ACROSS] Looking for clue at [row=${row}, col=${col}]`);
        
        if (!this.grid || this.grid.length === 0) {
            console.log('[ACROSS] No grid data');
            return null;
        }

        const gridHeight = this.grid.length;
        const gridWidth = this.grid[0]?.length || 0;
        console.log(`[ACROSS] Grid: ${gridHeight}x${gridWidth}`);

        // Find all across clues on this row
        const cluesOnRow = [];
        for (const [clueNum, position] of Object.entries(this.cluePositionsAcross)) {
            // Server sends (x, y) = (col, row)!
            const clueCol = position[0];
            const clueRow = position[1];
            
            console.log(`[ACROSS]   Clue ${clueNum}: position=(${clueCol}, ${clueRow}) → [row=${clueRow}, col=${clueCol}]`);
            
            if (clueRow === row) {
                cluesOnRow.push({ clueNum, clueCol });
                console.log(`[ACROSS]     → On same row!`);
            }
        }

        if (cluesOnRow.length === 0) {
            console.log('[ACROSS] No clues on this row');
            return null;
        }

        // Sort by column
        cluesOnRow.sort((a, b) => a.clueCol - b.clueCol);
        console.log(`[ACROSS] Sorted clues on row ${row}:`, cluesOnRow);

        // Find which clue this cell belongs to
        for (let i = 0; i < cluesOnRow.length; i++) {
            const startCol = cluesOnRow[i].clueCol;
            const endCol = i + 1 < cluesOnRow.length 
                ? cluesOnRow[i + 1].clueCol - 1 
                : gridWidth - 1;

            console.log(`[ACROSS]   Clue ${cluesOnRow[i].clueNum}: cols ${startCol}-${endCol}`);

            // Check if cell is within this clue range
            if (col >= startCol && col <= endCol) {
                console.log(`[ACROSS]   ✓ FOUND: Clue ${cluesOnRow[i].clueNum}`);
                return {
                    number: cluesOnRow[i].clueNum,
                    direction: 'across',
                    text: this.cluesAcross[cluesOnRow[i].clueNum] || ''
                };
            }
        }

        console.log('[ACROSS] Cell not in any clue range');
        return null;
    }

    /**
     * Find a vertical clue that contains the given cell
     * NOTE: Server sends positions as (x, y) = (col, row), NOT (row, col)!
     */
    _getCellDownClue(row, col) {
        console.log(`[DOWN] Looking for clue at [row=${row}, col=${col}]`);
        
        if (!this.grid || this.grid.length === 0) {
            console.log('[DOWN] No grid data');
            return null;
        }

        const gridHeight = this.grid.length;
        const gridWidth = this.grid[0]?.length || 0;
        console.log(`[DOWN] Grid: ${gridHeight}x${gridWidth}`);

        // Find all down clues in this column
        const cluesInCol = [];
        for (const [clueNum, position] of Object.entries(this.cluePositionsDown)) {
            // Server sends (x, y) = (col, row)!
            const clueCol = position[0];
            const clueRow = position[1];
            
            console.log(`[DOWN]   Clue ${clueNum}: position=(${clueCol}, ${clueRow}) → [row=${clueRow}, col=${clueCol}]`);
            
            if (clueCol === col) {
                cluesInCol.push({ clueNum, clueRow });
                console.log(`[DOWN]     → On same column!`);
            }
        }

        if (cluesInCol.length === 0) {
            console.log('[DOWN] No clues in this column');
            return null;
        }

        // Sort by row
        cluesInCol.sort((a, b) => a.clueRow - b.clueRow);
        console.log(`[DOWN] Sorted clues in column ${col}:`, cluesInCol);

        // Find which clue this cell belongs to
        for (let i = 0; i < cluesInCol.length; i++) {
            const startRow = cluesInCol[i].clueRow;
            const endRow = i + 1 < cluesInCol.length 
                ? cluesInCol[i + 1].clueRow - 1 
                : gridHeight - 1;

            console.log(`[DOWN]   Clue ${cluesInCol[i].clueNum}: rows ${startRow}-${endRow}`);

            // Check if cell is within this clue range
            if (row >= startRow && row <= endRow) {
                console.log(`[DOWN]   ✓ FOUND: Clue ${cluesInCol[i].clueNum}`);
                return {
                    number: cluesInCol[i].clueNum,
                    direction: 'down',
                    text: this.cluesDown[cluesInCol[i].clueNum] || ''
                };
            }
        }

        console.log('[DOWN] Cell not in any clue range');
        return null;
    }

    /**
     * Get current clue based on selected cell and mode
     */
    _getCurrentClue() {
        // Check if we're clicking on a wall - if so, no clue
        if (this.grid && this.grid[this.selectedRow] && this.grid[this.selectedRow][this.selectedCol] === '#') {
            return null;
        }

        if (this.selectedMode === 'horizontal') {
            return this._getCellAcrossClue(this.selectedRow, this.selectedCol);
        } else {
            return this._getCellDownClue(this.selectedRow, this.selectedCol);
        }
    }

    _toggleShowAllCluesAcross() {
        this._showAllCluesAcross = !this._showAllCluesAcross;
    }

    _toggleShowAllCluesDown() {
        this._showAllCluesDown = !this._showAllCluesDown;
    }

    /**
     * Find the starting row,col of an across clue by clue number
     */
    _getAcrossClueStart(clueNum) {
        const position = this.cluePositionsAcross[clueNum];
        if (!position) return null;
        // Server sends (x, y) = (col, row)
        const col = position[0];
        const row = position[1];
        return { row, col };
    }

    /**
     * Find the starting row,col of a down clue by clue number
     */
    _getDownClueStart(clueNum) {
        const position = this.cluePositionsDown[clueNum];
        if (!position) return null;
        // Server sends (x, y) = (col, row)
        const col = position[0];
        const row = position[1];
        return { row, col };
    }

    /**
     * Get all cells that belong to an across clue
     */
    _getAcrossCluesCells(clueNum) {
        const startPos = this._getAcrossClueStart(clueNum);
        if (!startPos) return [];
        
        const { row, col } = startPos;
        const cells = [];
        
        // Expand right until we hit a wall
        for (let c = col; c < this.gridData.cols; c++) {
            if (this.gridData.walls.has(`${row},${c}`)) {
                break;
            }
            cells.push({ row, col: c });
        }
        
        return cells;
    }

    /**
     * Get all cells that belong to a down clue
     */
    _getDownCluesCells(clueNum) {
        const startPos = this._getDownClueStart(clueNum);
        if (!startPos) return [];
        
        const { row, col } = startPos;
        const cells = [];
        
        // Expand down until we hit a wall
        for (let r = row; r < this.gridData.rows; r++) {
            if (this.gridData.walls.has(`${r},${col}`)) {
                break;
            }
            cells.push({ row: r, col });
        }
        
        return cells;
    }

    /**
     * Check if a clue is fully solved
     */
    _isCluesSolved(clueNum, direction) {
        const cells = direction === 'across' 
            ? this._getAcrossCluesCells(clueNum)
            : this._getDownCluesCells(clueNum);
        
        return cells.length > 0 && cells.every(cell => 
            this.gridData.solvedCells.has(`${cell.row},${cell.col}`)
        );
    }

    /**
     * Update which clues are solved
     */
    _updateSolvedClues() {
        this._solvedCluesAcross = new Set();
        this._solvedCluesDown = new Set();
        
        for (const clueNum of Object.keys(this.cluesAcross)) {
            if (this._isCluesSolved(clueNum, 'across')) {
                this._solvedCluesAcross.add(clueNum);
            }
        }
        
        for (const clueNum of Object.keys(this.cluesDown)) {
            if (this._isCluesSolved(clueNum, 'down')) {
                this._solvedCluesDown.add(clueNum);
            }
        }
    }

    /**
     * Handle clue item click - focus the cell and set orientation
     */
    _onClueItemClick(clueNum, direction) {
        let startPos;
        let mode;

        if (direction === 'across') {
            startPos = this._getAcrossClueStart(clueNum);
            mode = 'horizontal';
        } else {
            startPos = this._getDownClueStart(clueNum);
            mode = 'vertical';
        }

        if (!startPos) return;

        // Update selected cell and mode in parent grid
        this.selectedRow = startPos.row;
        this.selectedCol = startPos.col;
        this.selectedMode = mode;

        // Dispatch event to notify grid component
        this.dispatchEvent(new CustomEvent('clue-selected', {
            detail: {
                row: startPos.row,
                col: startPos.col,
                mode: mode
            },
            bubbles: true,
            composed: true
        }));

        // Close the all-clues view and return to default view
        this._showAllCluesAcross = false;
        this._showAllCluesDown = false;
    }

    render() {
        const currentClue = this._getCurrentClue();

        // Show across clues
        if (this._showAllCluesAcross) {
            return html`
                <div class="clue-area expanded">
                    <div class="clue-header">
                        <h3>Across Clues</h3>
                        <button class="clue-toggle" @click="${this._toggleShowAllCluesAcross}">
                            <span class="chevron">✕</span>
                        </button>
                    </div>
                    
                    <div class="clue-list-container">
                        <div class="clue-list">
                            ${Object.entries(this.cluesAcross).map(([num, text]) => html`
                                <div class="clue-item ${this._solvedCluesAcross.has(num) ? 'solved' : ''}" @click="${() => this._onClueItemClick(num, 'across')}" style="cursor: pointer;">
                                    <span class="clue-number">${num}.</span>
                                    <span class="clue-text">${text}</span>
                                </div>
                            `)}
                        </div>
                    </div>
                </div>
            `;
        }

        // Show down clues
        if (this._showAllCluesDown) {
            return html`
                <div class="clue-area expanded">
                    <div class="clue-header">
                        <h3>Down Clues</h3>
                        <button class="clue-toggle" @click="${this._toggleShowAllCluesDown}">
                            <span class="chevron">✕</span>
                        </button>
                    </div>
                    
                    <div class="clue-list-container">
                        <div class="clue-list">
                            ${Object.entries(this.cluesDown).map(([num, text]) => html`
                                <div class="clue-item ${this._solvedCluesDown.has(num) ? 'solved' : ''}" @click="${() => this._onClueItemClick(num, 'down')}" style="cursor: pointer;">
                                    <span class="clue-number">${num}.</span>
                                    <span class="clue-text">${text}</span>
                                </div>
                            `)}
                        </div>
                    </div>
                </div>
            `;
        }

        // Default view with both buttons
        return html`
            <div class="clue-area">
                <div class="clue-header">
                    ${currentClue ? html`
                        <div class="current-clue">
                            <span class="clue-number">${currentClue.direction === 'across' ? '▶' : '▼'} ${currentClue.number}</span>
                        </div>
                        <div class="clue-text">${currentClue.text}</div>
                    ` : html`
                        <div class="clue-text empty">No clue for this cell</div>
                    `}
                    
                    <div class="clue-toggle-group">
                        <div class="clue-text empty">Clues:</div>

                        <button class="clue-toggle" @click="${this._toggleShowAllCluesAcross}" title="Show all across clues">
                            <span class="chevron">▶</span>
                        </button>
                        <button class="clue-toggle" @click="${this._toggleShowAllCluesDown}" title="Show all down clues">
                            <span class="chevron">▼</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('clue-area', ClueArea);
