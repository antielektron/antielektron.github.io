import { LitElement, html } from 'https://unpkg.com/lit@2.7.5/index.js?module';
import wsManager from './websocket.js';

/**
 * <crossword-grid>
 * Simple Lit-based grid component for testing the crossword UI.
 * - Attributes: rows, cols (numbers)
 * - Public behavior: listens for 'key-press' CustomEvents on window and
 *   places letters / navigates accordingly.
 * - Dispatches 'cell-selected' when user taps a cell.
 */
export class CrosswordGrid extends LitElement {
	static properties = {
		rows: { type: Number },
		cols: { type: Number },
		_grid: { state: true },
		_selected: { state: true },
		_inputMode: { state: true }, // 'horizontal' or 'vertical'
		_solvedCells: { state: true }, // tracks which cells are solved
		_clueNumbers: { state: true }, // map of "row,col" -> { across: number, down: number }
		_solutionIndices: { state: true }, // map of "row,col" -> solution index
		_solutionWordPositions: { state: true }, // list of [col, row] positions for solution word
		_solutionWordValues: { state: true }, // map of index -> letter for solution word
		_solutionWordSolved: { state: true }, // set of solution word indices that are solved
	};

	// styles moved to webui/styles.css; render into light DOM so external CSS applies

	constructor() {
		super();
		this.rows = 10;
		this.cols = 10;
		this._grid = [];
		this._selected = { r: 0, c: 0 };
		this._inputMode = 'horizontal'; // default input mode
		this._solvedCells = new Set(); // set of "r,c" strings for solved cells
		this._clueNumbers = new Map(); // map of "row,col" -> { across: number, down: number }
		this._solutionIndices = new Map(); // map of "row,col" -> solution index (1-indexed)
		this._solutionWordPositions = []; // list of [col, row] positions
		this._solutionWordValues = new Map(); // map of index -> letter
		this._solutionWordSolved = new Set(); // set of solution word indices that are solved
		this.sessionId = null; // Session ID for sending updates to server
	}

	createRenderRoot() { return this; }

	connectedCallback() {
		super.connectedCallback();
		// initialize empty grid
		this._ensureGrid();
		// listen for keyboard (mobile) events
		this._keyHandler = (e) => this._onKeyPress(e.detail);
		window.addEventListener('key-press', this._keyHandler);
		this._computeCellSize();
		this._resizeHandler = () => this._computeCellSize();
		window.addEventListener('resize', this._resizeHandler);
			// make the element focusable so it can receive physical keyboard events
			this.setAttribute('tabindex', '0');
			this._keydownHandler = (e) => this._onKeydown(e);
			this.addEventListener('keydown', this._keydownHandler);
			// Listen for letter updates from server
			this._letterUpdateHandler = (msg) => this._onLetterUpdateFromServer(msg);
			wsManager.onMessage('letter_update', this._letterUpdateHandler);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		window.removeEventListener('key-press', this._keyHandler);
			this.removeEventListener('keydown', this._keydownHandler);
		window.removeEventListener('resize', this._resizeHandler);
		wsManager.offMessage('letter_update', this._letterUpdateHandler);
	}

	_ensureGrid() {
		if (!this._grid || this._grid.length !== this.rows) {
			this._grid = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => ''));
		}
	}

	render() {
		this._ensureGrid();
		// set CSS variables for cell-size and column count; layout done in external stylesheet
		return html`
			<div class="grid-container ${this._isSolutionWordComplete() ? 'complete' : ''}">
				<div class="grid" style="--cell-size: ${this._cellSize}px; --cols: ${this.cols};">
					${this._grid.map((row, r) => row.map((cell, c) => this._renderCell(r, c, cell))).flat()}
				</div>
			</div>
			${this._solutionWordPositions.length > 0 ? html`
				<h3 style="margin-top: 2rem;">Solution Word</h3>
				<div class="grid solution-word-grid" style="--cell-size: 40px; --cols: ${this._solutionWordPositions.length};">
					${this._solutionWordPositions.map((pos, i) => this._renderSolutionCell(i, pos))}
				</div>
			` : ''}
		`;
	}
	
	_renderSolutionCell(index, position) {
		const letter = this._solutionWordValues.get(index) || '';
		const isSolved = this._solutionWordSolved.has(index);
		const classes = ['cell'];
		if (isSolved) classes.push('solved');
		
		return html`
			<div class="${classes.join(' ')}" data-solution-index="${index}" data-row="${position[1]}" data-col="${position[0]}" @click=${() => this._onSolutionCellClick(index, position)}>
				<div class="solution-circle"></div>
				<span class="solution-index">${index + 1}</span>
				<span class="cell-letter">${letter}</span>
			</div>
		`;
	}


	_computeCellSize() {
		// compute a comfortable cell size depending on viewport width and number of columns
		try {
			const maxWidth = Math.min(window.innerWidth * 0.92, 720); // keep some margin
			let size = Math.floor((maxWidth - 16) / this.cols);
			// clamp sizes
			if (window.innerWidth <= 450) {
				// on very small screens, allow larger tap targets up to 56px
				size = Math.min(Math.max(size, 44), 64);
			} else if (window.innerWidth <= 900) {
				size = Math.min(Math.max(size, 40), 56);
			} else {
				size = Math.min(Math.max(size, 40), 48);
			}
			this._cellSize = size;
			this.requestUpdate();
		} catch (e) {
			// fallback
			this._cellSize = 44;
		}
	}

	_renderCell(r, c, value) {
		const classes = ['cell'];
		const cellKey = `${r},${c}`;
		const isSolved = this._solvedCells.has(cellKey);
		
		if (value === '#') classes.push('wall');
		if (isSolved) classes.push('solved');
		if (this._selected.r === r && this._selected.c === c) classes.push('selected');
		
		// Check if this cell is in the highlighted row/column based on input mode
		// But only if it's not a wall
		if (value !== '#') {
			if (this._inputMode === 'horizontal' && r === this._selected.r && this._isInHorizontalLine(r, c)) {
				classes.push('mode-highlighted');
			} else if (this._inputMode === 'vertical' && c === this._selected.c && this._isInVerticalLine(r, c)) {
				classes.push('mode-highlighted');
			}
		}
		
		// Get clue numbers for this cell
		const clueInfo = this._clueNumbers.get(cellKey);
		let clueNumberDisplay = '';
		if (clueInfo) {
			if (clueInfo.across !== null && clueInfo.down !== null) {
				// Both across and down clues: show "across/down" format
				clueNumberDisplay = `${clueInfo.across}/${clueInfo.down}`;
			} else if (clueInfo.across !== null) {
				// Only across clue
				clueNumberDisplay = String(clueInfo.across);
			} else if (clueInfo.down !== null) {
				// Only down clue
				clueNumberDisplay = String(clueInfo.down);
			}
		}
		
		// Get solution index for this cell
		const solutionIndex = this._solutionIndices.get(cellKey);
		
		const cellContent = clueNumberDisplay 
			? html`<span class="clue-number">${clueNumberDisplay}</span><span class="cell-letter">${value}</span>`
			: html`<span class="cell-letter">${value}</span>`;
		
		const cellHTML = solutionIndex !== undefined
			? html`${cellContent}<div class="solution-circle"></div><span class="solution-index">${solutionIndex}</span>`
			: cellContent;
		
		return html`<div class="${classes.join(' ')}" @click=${() => this._onCellClick(r, c)} data-r="${r}" data-c="${c}">${cellHTML}</div>`;
	}

	/**
	 * Get the length of the horizontal line at the selected cell
	 */
	_getHorizontalLineLength(r = this._selected.r, c = this._selected.c) {
		let start = c, end = c;
		
		// Expand left
		while (start > 0 && this._grid[r][start - 1] !== '#') {
			start--;
		}
		// Expand right
		while (end < this.cols - 1 && this._grid[r][end + 1] !== '#') {
			end++;
		}
		
		return end - start + 1;
	}

	/**
	 * Check if cell (r, c) is part of the horizontal line from the selected cell
	 * (i.e., same row and not blocked by walls before/after this cell)
	 */
	_isInHorizontalLine(r, c) {
		const selectedRow = this._selected.r;
		if (r !== selectedRow) return false;
		
		const selectedCol = this._selected.c;
		// Find the start and end of the continuous line in this row
		let start = selectedCol, end = selectedCol;
		
		// Expand left
		while (start > 0 && this._grid[r][start - 1] !== '#') {
			start--;
		}
		// Expand right
		while (end < this.cols - 1 && this._grid[r][end + 1] !== '#') {
			end++;
		}
		
		return c >= start && c <= end;
	}

	/**
	 * Get the length of the vertical line at the selected cell
	 */
	_getVerticalLineLength(r = this._selected.r, c = this._selected.c) {
		let start = r, end = r;
		
		// Expand up
		while (start > 0 && this._grid[start - 1][c] !== '#') {
			start--;
		}
		// Expand down
		while (end < this.rows - 1 && this._grid[end + 1][c] !== '#') {
			end++;
		}
		
		return end - start + 1;
	}

	/**
	 * Check if the entire solution word is solved
	 */
	_isSolutionWordComplete() {
		if (this._solutionWordPositions.length === 0) return false;
		return this._solutionWordPositions.every((_, i) => this._solutionWordSolved.has(i));
	}

	/**
	 * Check if cell (r, c) is part of the vertical line from the selected cell
	 * (i.e., same column and not blocked by walls above/below this cell)
	 */
	_isInVerticalLine(r, c) {
		const selectedCol = this._selected.c;
		if (c !== selectedCol) return false;
		
		const selectedRow = this._selected.r;
		// Find the start and end of the continuous line in this column
		let start = selectedRow, end = selectedRow;
		
		// Expand up
		while (start > 0 && this._grid[start - 1][c] !== '#') {
			start--;
		}
		// Expand down
		while (end < this.rows - 1 && this._grid[end + 1][c] !== '#') {
			end++;
		}
		
		return r >= start && r <= end;
	}

	_onCellClick(r, c, preferredMode = null) {
		// if same cell is clicked again, toggle the input mode
		if (this._selected.r === r && this._selected.c === c) {
			// If a preferred mode is provided, use it (don't toggle)
			if (preferredMode) {
				this._inputMode = preferredMode;
			} else {
				this._inputMode = this._inputMode === 'horizontal' ? 'vertical' : 'horizontal';
			}
		} else {
			// select a new cell
			this._selected = { r, c };
			
			// Use preferred mode if provided, otherwise auto-select based on line lengths
			if (preferredMode) {
				this._inputMode = preferredMode;
			} else {
				// auto-select mode based on line lengths
				const horizontalLength = this._getHorizontalLineLength(r, c);
				const verticalLength = this._getVerticalLineLength(r, c);
				
				// if one mode only has 1 cell but the other has multiple, use the one with multiple
				if (horizontalLength === 1 && verticalLength > 1) {
					this._inputMode = 'vertical';
				} else if (verticalLength === 1 && horizontalLength > 1) {
					this._inputMode = 'horizontal';
				}
				// otherwise keep current mode (both >1 or both =1)
			}
		}
		this.requestUpdate();
		this.dispatchEvent(new CustomEvent('cell-selected', { detail: { row: r, col: c, mode: this._inputMode }, bubbles: true, composed: true }));
			// focus the element so keyboard input goes to the grid
			this.focus();
	}

	_onSolutionCellClick(index, position) {
		// When clicking a solution word cell, select the corresponding grid cell
		const [col, row] = position;
		this._onCellClick(row, col);
	}

	_onKeydown(e) {
		// Only handle keys when the grid has focus
		// Map letters, arrows and backspace to our handlers
		const key = e.key;
		if (!key) return;
		// letters (accept single-character a-z)
		if (/^[a-zA-Z]$/.test(key)) {
			e.preventDefault();
			this._onKeyPress({ type: 'letter', value: key.toLowerCase() });
			return;
		}
		// spacebar - treat as a letter input (empty string)
		if (key === ' ') {
			e.preventDefault();
			this._onKeyPress({ type: 'letter', value: ' ' });
			return;
		}
		// navigation arrows
		if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
			e.preventDefault();
			const dir = key.replace('Arrow', '').toLowerCase();
			this._onKeyPress({ type: 'navigate', value: dir });
			return;
		}
		// backspace/delete
		if (key === 'Backspace' || key === 'Delete') {
			e.preventDefault();
			this._onKeyPress({ type: 'backspace' });
			return;
		}
	}	_onKeyPress(detail) {
		if (!detail) return;
		const { type, value } = detail;
		if (type === 'letter') {
			this._placeLetter(value);
		} else if (type === 'navigate') {
			this._navigate(value);
		} else if (type === 'backspace') {
			this._handleBackspace();
		}
	}

	_handleBackspace() {
		const { r, c } = this._selected;
		const cellKey = `${r},${c}`;
		
		// ignore walls
		if (this._grid[r][c] === '#') return;
		
		// If it's a solved cell, just navigate back without changing it
		if (this._solvedCells.has(cellKey)) {
			if (this._inputMode === 'horizontal') {
				this._moveToNextCell(r, c, 'left');
			} else { // vertical
				this._moveToNextCell(r, c, 'up');
			}
			return;
		}
		
		// delete the letter at current cell (only for non-solved cells)
		this._grid = this._grid.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? '' : cell)));
		
		// Send letter update to server (empty string for cleared cell)
		if (this.sessionId && wsManager.isConnected()) {
			const message = {
				type: 'update_letter',
				session_id: this.sessionId,
				row: r,
				col: c,
				letter: ''
			};
			wsManager.send(message);
		}
		
		// move to previous cell based on input mode
		if (this._inputMode === 'horizontal') {
			this._moveToNextCell(r, c, 'left');
		} else { // vertical
			this._moveToNextCell(r, c, 'up');
		}
		this.requestUpdate();
	}

	_placeLetter(letter) {
		const { r, c } = this._selected;
		const cellKey = `${r},${c}`;
		const currentLetter = this._grid[r][c];
		
		// ignore walls
		if (currentLetter === '#') return;
		
		// For solved cells, only navigate (don't send updates)
		if (this._solvedCells.has(cellKey)) {
			// Only move if space or letter matches
			if (letter === ' ' || letter.toUpperCase() === currentLetter.toUpperCase()) {
				if (this._inputMode === 'horizontal') {
					this._moveToNextCell(r, c, 'right');
				} else { // vertical
					this._moveToNextCell(r, c, 'down');
				}
			}
			return;
		}
		
		// Check if the letter is the same as what's already there (case insensitive)
		const isSameLetter = letter !== ' ' && letter.toUpperCase() === currentLetter.toUpperCase();
		
		// Only update grid and send message if it's a different letter
		if (!isSameLetter) {
			this._grid = this._grid.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? letter : cell)));
			
			// Send letter update to server (empty string for space)
			if (this.sessionId && wsManager.isConnected()) {
				const message = {
					type: 'update_letter',
					session_id: this.sessionId,
					row: r,
					col: c,
					letter: letter === ' ' ? '' : letter
				};
				wsManager.send(message);
			}
		}
		
		// move to next cell if:
		// - space was pressed, OR
		// - the letter is the same as what was already there, OR
		// - a new letter was placed
		const shouldMove = letter === ' ' || isSameLetter || letter !== '';
		
		if (shouldMove) {
			if (this._inputMode === 'horizontal') {
				this._moveToNextCell(r, c, 'right');
			} else { // vertical
				this._moveToNextCell(r, c, 'down');
			}
		}
		this.requestUpdate();
	}

	/**
	 * Move from current cell to next valid cell in the given direction
	 */
	_moveToNextCell(r, c, direction) {
		let nr = r, nc = c;
		if (direction === 'right') nc += 1;
		else if (direction === 'left') nc -= 1;
		else if (direction === 'down') nr += 1;
		else if (direction === 'up') nr -= 1;

		// check bounds and walls
		if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this._grid[nr][nc] !== '#') {
			this._selected = { r: nr, c: nc };
		}
	}

	_navigate(direction) {
		// Check if the arrow direction matches the current input mode
		// If not, switch modes instead of navigating
		const isHorizontalArrow = direction === 'left' || direction === 'right';
		const isVerticalArrow = direction === 'up' || direction === 'down';
		
		if (this._inputMode === 'horizontal' && isVerticalArrow) {
			// User pressed up/down arrow but mode is horizontal, switch to vertical
			this._inputMode = 'vertical';
			this.requestUpdate();
			// Emit event for mode change
			this.dispatchEvent(new CustomEvent('cell-selected', { detail: { row: this._selected.r, col: this._selected.c, mode: this._inputMode }, bubbles: true, composed: true }));
			return;
		}
		
		if (this._inputMode === 'vertical' && isHorizontalArrow) {
			// User pressed left/right arrow but mode is vertical, switch to horizontal
			this._inputMode = 'horizontal';
			this.requestUpdate();
			// Emit event for mode change
			this.dispatchEvent(new CustomEvent('cell-selected', { detail: { row: this._selected.r, col: this._selected.c, mode: this._inputMode }, bubbles: true, composed: true }));
			return;
		}
		
		// Direction matches mode, navigate normally
		const { r, c } = this._selected;
		let nr = r, nc = c;
		if (direction === 'left') nc = Math.max(0, c - 1);
		if (direction === 'right') nc = Math.min(this.cols - 1, c + 1);
		if (direction === 'up') nr = Math.max(0, r - 1);
		if (direction === 'down') nr = Math.min(this.rows - 1, r + 1);
		
		// Check for walls
		if (this._grid[nr] && this._grid[nr][nc] === '#') {
			return; // Don't navigate into walls
		}
		
		this._selected = { r: nr, c: nc };
		this.requestUpdate();
		// Emit event for navigation
		this.dispatchEvent(new CustomEvent('cell-selected', { detail: { row: nr, col: nc, mode: this._inputMode }, bubbles: true, composed: true }));
	}

	// convenience method to set grid walls (for demo)
	setWalls(wallPositions = []) {
		wallPositions.forEach(([r, c]) => {
			if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
				this._grid[r][c] = '#';
			}
		});
		this.requestUpdate();
	}

	/**
	 * Handle letter updates from server (broadcast messages from other players)
	 */
	_onLetterUpdateFromServer(message) {
		const { row, col, letter, is_solved } = message;
		
		// Update grid if within bounds
		if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
			this._grid = this._grid.map((gridRow, ri) => 
				gridRow.map((cell, ci) => (ri === row && ci === col ? letter : cell))
			);
			
			// Update solved status
			const cellKey = `${row},${col}`;
			if (is_solved) {
				this._solvedCells.add(cellKey);
			} else {
				this._solvedCells.delete(cellKey);
			}
			
			// Update solution word if this position is part of it
			for (let i = 0; i < this._solutionWordPositions.length; i++) {
				const [col_sw, row_sw] = this._solutionWordPositions[i];
				if (row === row_sw && col === col_sw) {
					this._solutionWordValues.set(i, letter);
					// Mark solution word cell as solved
					if (is_solved) {
						this._solutionWordSolved.add(i);
					} else {
						this._solutionWordSolved.delete(i);
					}
					break;
				}
			}
			
			this.requestUpdate();
			
			// Trigger animation if solution word just completed
			if (this._isSolutionWordComplete()) {
				this.updateComplete.then(() => {
					const gridContainer = this.querySelector('.solution-word-grid');
					if (gridContainer) {
						// Force reflow to trigger animation
						gridContainer.offsetHeight;
						gridContainer.classList.remove('complete');
						gridContainer.offsetHeight;
						gridContainer.classList.add('complete');
					}
				});
			}
			
			// Emit a letter-changed event so solution word can update
			this.dispatchEvent(new CustomEvent('letter-changed', {
				detail: { row, col, letter, is_solved },
				bubbles: true,
				composed: true
			}));
			
			console.log(`Letter update from server: [${row}, ${col}] = "${letter}" (solved: ${is_solved})`);
		}
	}

	/**
	 * Populate clue numbers from server data
	 * @param {Object} cluePositionsAcross - dict of clue_number -> [col, row]
	 * @param {Object} cluePositionsDown - dict of clue_number -> [col, row]
	 */
	populateClueNumbers(cluePositionsAcross = {}, cluePositionsDown = {}) {
		this._clueNumbers.clear();
		
		// Add across clues
		for (const [clueNum, position] of Object.entries(cluePositionsAcross)) {
			const [col, row] = position;
			const cellKey = `${row},${col}`;
			
			if (!this._clueNumbers.has(cellKey)) {
				this._clueNumbers.set(cellKey, { across: null, down: null });
			}
			
			this._clueNumbers.get(cellKey).across = parseInt(clueNum);
		}
		
		// Add down clues
		for (const [clueNum, position] of Object.entries(cluePositionsDown)) {
			const [col, row] = position;
			const cellKey = `${row},${col}`;
			
			if (!this._clueNumbers.has(cellKey)) {
				this._clueNumbers.set(cellKey, { across: null, down: null });
			}
			
			this._clueNumbers.get(cellKey).down = parseInt(clueNum);
		}
		
		this.requestUpdate();
	}

	/**
	 * Populate solution word indices from server data
	 * @param {Array} solutionPositions - list of [col, row] positions in order
	 */
	populateSolutionIndices(solutionPositions = []) {
		this._solutionIndices.clear();
		this._solutionWordPositions = solutionPositions;
		this._solutionWordValues.clear();
		this._solutionWordSolved.clear();
		
		for (let i = 0; i < solutionPositions.length; i++) {
			const [col, row] = solutionPositions[i];
			const cellKey = `${row},${col}`;
			this._solutionIndices.set(cellKey, i + 1);  // 1-indexed
			
			// Initialize solution word value with current grid letter
			const letter = this._grid[row][col] || '';
			this._solutionWordValues.set(i, letter);
			
			// Check if this position is already solved
			if (this._solvedCells.has(cellKey)) {
				this._solutionWordSolved.add(i);
			}
		}
		
		console.log('Solution word initialized. Solved:', this._solutionWordSolved.size, 'Total:', this._solutionWordPositions.length);
		this.requestUpdate();
		
		// Trigger animation on init if already complete
		if (this._isSolutionWordComplete()) {
			this.updateComplete.then(() => {
				const gridContainer = this.querySelector('.solution-word-grid');
				if (gridContainer) {
					// Force reflow to trigger animation
					gridContainer.offsetHeight;
					gridContainer.classList.remove('complete');
					gridContainer.offsetHeight;
					gridContainer.classList.add('complete');
				}
			});
		}
	}
}

customElements.define('crossword-grid', CrosswordGrid);