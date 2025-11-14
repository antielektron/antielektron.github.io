import { LitElement, html } from 'https://unpkg.com/lit@2.7.5/index.js?module';

/**
 * <mobile-keyboard>
 * A compact on-screen keyboard for mobile devices. Emits 'key-press' events on window
 * with detail { type: 'letter'|'navigate'|'backspace', value }
 */
export class MobileKeyboard extends LitElement {
	static properties = {
		// reflect so CSS attribute selectors can react to collapsed state
		collapsed: { type: Boolean, reflect: true },
		_isMobile: { type: Boolean, state: true },
		_wideScreen: { type: Boolean, state: true },
	};

	// styles moved to webui/styles.css; render into light DOM so external CSS applies

	constructor() {
		super();
		this.collapsed = true; // default collapsed; _onResize will flip for mobile
		this._isMobile = false;
		this._letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
		this._onResize = this._onResize.bind(this);
	}

	createRenderRoot() { return this; }

	render() {
		// simple QWERTY-like rows
		const rows = [
			'qwertyuiop'.split(''),
			'asdfghjkl'.split(''),
			'zxcvbnm'.split(''),
		];

		// compute the maximum number of columns across rows (account for backspace in second row now)
		const counts = rows.map((r, idx) => r.length + (idx === 1 ? 1 : 0));
		const arrowCols = 3; // reserve 3 columns on the right for [left][down][right]
		const baseMax = Math.max(...counts, 10);
		const maxCols = baseMax;

		return html`
			<div class="keyboard-container">
				${html`<div class="handle" @click=${this._toggleCollapse}>
					<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align: middle; margin-right: 0.3rem;">
						<path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm6 7H5v-2h8v2zm0-4h-2v-2h2v2zm3 0h-2v-2h2v2zm3 0h-2v-2h2v2zm0-3h-2V8h2v2z"/>
					</svg>
					${this.collapsed ? '▲' : '▼'}
				</div>`}
				<div class="keyboard-wrapper">
					<div class="keyboard">
						${rows.map((r, idx) => {
							// center the letter keys leaving the rightmost `arrowCols` for the arrow block

							let rowClasses = 'row';
							if (idx === 1) rowClasses += ' stagger'; // A row
							if (idx === 2) rowClasses += ' stagger-deep'; // Z row needs a larger indent
							return html`<div class="${rowClasses}" style="--cols:${maxCols-idx}; --arrow-cols:${arrowCols};">
								<div class="keys">
									${r.map(l => html`<button @click=${() => this._emitLetter(l)}>${l}</button>`) }
									${idx === 1 ? html`<button class="backspace" @click=${() => this._emitBackspace()}>⌫</button>` : ''}
								</div>
								<div class="arrows">
									${Array.from({ length: arrowCols }).map((_, i) => {
										if (idx === 2 && i === 1) return html`<button class="nav" @click=${() => this._emitNavigate('up')}>▲</button>`;
										return html`<div class="key-spacer"></div>`;
									})}
								</div>
							</div>`;
						})}

						<!-- spacebar row -->
						<div class="row" style="--cols:${maxCols};">
							<!-- spacebar spans all but the right arrow columns -->
							<button class="space" @click=${() => this._emitSpace()}>␣</button>
							<!-- arrow columns: left, down, right (will occupy the last 3 columns) -->
							<button class="nav" @click=${() => this._emitNavigate('left')}>◀</button>
							<button class="nav" @click=${() => this._emitNavigate('down')}>▼</button>
							<button class="nav" @click=${() => this._emitNavigate('right')}>▶</button>
						</div>
					</div>
				</div>
			</div>
		`;
	}	_emitLetter(l) {
		this._vibrate();
		this._emit({ type: 'letter', value: l });
	}

	_emitNavigate(dir) {
		this._vibrate();
		this._emit({ type: 'navigate', value: dir });
	}

	_emitBackspace() {
		this._vibrate();
		this._emit({ type: 'backspace' });
	}

	_emitSpace() {
		this._vibrate();
		this._emit({ type: 'letter', value: '' });
	}

	_emit(detail) {
		window.dispatchEvent(new CustomEvent('key-press', { detail }));
	}

	_vibrate() {
		// Use Vibration API for haptic feedback
		try {
			console.log('Attempting vibration... navigator.vibrate:', typeof navigator.vibrate);
			if (navigator.vibrate) {
				navigator.vibrate(10); // 10ms short buzz
				console.log('Vibration sent!');
			} else {
				console.log('Vibration API not available on this device');
			}
		} catch (e) {
			console.warn('Vibration API error:', e);
		}
	}

		connectedCallback() {
			super.connectedCallback();
			window.addEventListener('resize', this._onResize);
			this._onResize();
		}

		disconnectedCallback() {
			super.disconnectedCallback();
			window.removeEventListener('resize', this._onResize);
		}

		_onResize() {
			const mobile = window.innerWidth <= 900;
			this._isMobile = mobile;
			this.classList.toggle('mobile', mobile);
			this.classList.toggle('desktop', !mobile);
			// decide wide-screen (landscape/tablet) to change layout behavior
			const wide = (window.innerWidth / window.innerHeight) > 1.6;
			this._wideScreen = wide;
			this.classList.toggle('wide-screen', wide);
			// collapsed default: expanded on mobile, collapsed on desktop
			if (mobile) this.collapsed = false;
			else this.collapsed = true;
		}

		_toggleCollapse() {
			this.collapsed = !this.collapsed;
			if (this.collapsed) this.setAttribute('collapsed', '');
			else this.removeAttribute('collapsed');
		}
}

customElements.define('mobile-keyboard', MobileKeyboard);