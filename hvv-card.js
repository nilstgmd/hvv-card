const LitElement = Object.getPrototypeOf(
    customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

function hasConfigOrEntityChanged(element, changedProps) {
    if (changedProps.has("_config")) {
        return true;
    }

    const oldHass = changedProps.get("hass");
    if (!oldHass) {
        return true;
    }

    for (const entity of element._config.entities) {
        const entityId = typeof entity === 'string' ? entity : entity.entity;
        if (oldHass.states[entityId] !== element.hass.states[entityId]) {
            return true;
        }
    }

    return false;
}

class HvvCard extends LitElement {
    static get properties() {
        return {
            _config: {},
            hass: {},
            _timeOffset: { type: Number }
        };
    }

    static getConfigElement() {
        return document.createElement("hvv-card-editor");
    }

    static getStubConfig() {
        return {
            entities: [],
            title: "HVV Departures",
            max: 5,
            show_title: true,
            show_name: true,
            show_time: false,
            show_time_filter: true,
            filter_lines: [],
            filter_destinations: []
        };
    }

    constructor() {
        super();
        this._timeOffset = 0;
    }

    _onTimeOffsetChange(e) {
        this._timeOffset = parseInt(e.target.value, 10) || 0;
    }

    setConfig(config) {
        if (config.entity) {
            throw new Error("The entity property is deprecated, please use entities instead.")
        }

        if (!config.entities) {
            throw new Error("The entities property is required.")
        }
        this._config = config;
    }

    shouldUpdate(changedProps) {
        return hasConfigOrEntityChanged(this, changedProps);
    }

    render() {
        if (!this._config || !this.hass) {
            return html ``;
        }

        var title = this._config.title ? this._config.title : "HVV Departures";
        var showTitle = this._config.show_title !== false;
        var showName = this._config.show_name !== false;
        var showTimeFilter = this._config.show_time_filter !== false;

        // Normalize filter arrays (trim, lowercase for case-insensitive matching)
        const filterLines = (this._config.filter_lines || [])
            .map(l => l.trim().toLowerCase())
            .filter(l => l.length > 0);
        const filterDestinations = (this._config.filter_destinations || [])
            .map(d => d.trim().toLowerCase())
            .filter(d => d.length > 0);

        return html `
             <ha-card>
                ${showTitle || showTimeFilter ? html`
                <div class="header-row">
                    ${showTitle ?
                        html`<h1 class="card-header">${title}</h1>`
                        : html`<span></span>`
                    }
                    ${showTimeFilter ? html`
                    <div class="time-control">
                        <label>in</label>
                        <input type="number" min="0" max="120" 
                               .value="${this._timeOffset}" 
                               @change="${this._onTimeOffsetChange}">
                        <span>min</span>
                    </div>
                    ` : ''}
                </div>
                ` : ''}

                ${this._config.entities.map((ent) => {
                    const entityId = typeof ent === 'string' ? ent : ent.entity;
                    const customName = typeof ent === 'object' && ent.name ? ent.name : null;
                    const stateObj = this.hass.states[entityId];
                    if (!stateObj) {
                        return html `
                            <style>
                                .not-found {
                                flex: 1;
                                background-color: yellow;
                                padding: 8px;
                                }
                            </style>
                            <ha-card>
                                <div class="not-found">
                                Entity not available: ${entityId}
                                </div>
                            </ha-card>
                            `;
                    }

                    const displayName = customName || stateObj.attributes['friendly_name'];

                    if (stateObj.state == 'unavailable') {
                        return html`
                            <div>
                                ${showName && displayName
                                    ? html`
                                        <h2 style="padding-left: 16px;">${displayName} <ha-icon icon="mdi:vector-polyline-remove" style="color: red;"></ha-icon></h2>
                                    `
                                    : ""}
                            </div>
                        `;
                    }

                    if (!stateObj.attributes['next'] || stateObj.attributes['next'].length === 0) {
                        return html`
                            <div>
                                ${showName && displayName
                                    ? html`<h2 style="padding-left: 16px;">${displayName}</h2>`
                                    : ""}
                                <p class="no-departures">No departures</p>
                            </div>
                        `;
                    }

                    const today = new Date();
                    const offsetMs = this._timeOffset * 60 * 1000;
                    const referenceTime = new Date(today.getTime() + offsetMs);
                    const max = this._config.max ? this._config.max : 5;

                    // Filter departures by reference time, optional line/destination filters,
                    // sort by actual departure (scheduled + delay), and limit to max
                    const filteredDepartures = stateObj.attributes['next']
                        .filter(attr => new Date(attr.departure) >= referenceTime)
                        .filter(attr => {
                            if (filterLines.length === 0) return true;
                            return filterLines.includes((attr.line || '').toLowerCase());
                        })
                        .filter(attr => {
                            if (filterDestinations.length === 0) return true;
                            const dir = (attr.direction || '').toLowerCase();
                            return filterDestinations.some(fd => dir.includes(fd));
                        })
                        .sort((a, b) => {
                            const aActual = new Date(a.departure).getTime() + (a.delay || 0) * 1000;
                            const bActual = new Date(b.departure).getTime() + (b.delay || 0) * 1000;
                            return aActual - bActual;
                        })
                        .slice(0, max);

                    return html `
                    <div>
                        ${showName && displayName
                        ? html`
                            <h2 style="padding-left: 16px;">${displayName}</h2>
                            `
                        : ""
                        }
                        ${filteredDepartures.length === 0
                            ? html`<p class="no-departures">No departures match the current filters</p>`
                            : html`
                        <table>
                            ${filteredDepartures.map(attr => {
                                const direction = attr['direction'];
                                const line = attr['line'];
                                const type = attr['type'];
                                const delay_seconds = attr['delay'];
                                const delay_minutes = (delay_seconds / 60);
                                const departure = new Date(attr["departure"]);
                                const cancelled = attr['cancelled'] || false;
                                
                                const diffMs = departure - today;
                                const departureHours = Math.floor((diffMs / (1000*60*60)) % 24);
                                const departureMins = Math.round((diffMs / (1000*60)) % 60);

                                return html`
                                    <tr class="${cancelled ? 'cancelled' : ''}">
                                        <td class="narrow" style="text-align:center;"><span class="line ${type} ${line}">${line}</span></td>
                                        <td class="expand">${cancelled ? html`<s>${direction}</s>` : direction}</td>
                                        <td class="narrow" style="text-align:right;">
                                            ${cancelled
                                                ? html`<span class="cancelled-badge">Cancelled</span>`
                                                : html`
                                                    ${this._config.show_time ?
                                                        departure.toLocaleTimeString(
                                                            this.hass.locale.language,
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: this.hass.locale.time_format === '12'
                                                            }
                                                        ) :
                                                        departureHours > 0 ?
                                                            departureHours + `:` + departureMins :
                                                            departureMins
                                                    }
                                                    ${delay_minutes > 0 ?
                                                        html`<span class="delay_minutes">+${delay_minutes}</span>` :
                                                        ``}
                                                    ${delay_minutes <= 0 && this._config.show_time ?
                                                        `` :
                                                        departureHours > 0 ?
                                                            `h:min` :
                                                            `min`
                                                    }
                                                `
                                            }
                                        </td>
                                    </tr>
                                    `;
                            })}
                        </table>`}
                    </div>
            `;
        })}
        </ha-card>
        `;
    }

    getCardSize() {
        return 1;
    }

    static get styles() {
        return css `
        .header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-right: 16px;
        }
        
        .header-row .card-header {
            padding: 24px 0 0 16px;
            margin: 0;
            font-size: 1.5em;
            font-weight: 500;
        }
        
        .time-control {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.9em;
            color: var(--secondary-text-color);
            padding-top: 16px;
        }
        
        .time-control label {
            opacity: 0.7;
        }
        
        .time-control input {
            width: 48px;
            padding: 4px 6px;
            text-align: right;
            border: 1px solid var(--divider-color, #e0e0e0);
            border-radius: 4px;
            background: var(--card-background-color, #fff);
            color: var(--primary-text-color);
            font-size: 0.95em;
        }
        
        .time-control input:focus {
            outline: none;
            border-color: var(--primary-color);
        }
        
        .time-control span {
            opacity: 0.7;
        }
        
        table {
            width: 100%;
            padding: 6px 14px;
        }

        td {
            padding: 3px 0px;
        }

        td.narrow {
            white-space: nowrap;
        }

        td.expand {
            width: 95%;
        }

        span.line {
            font-weight: bold;
            font-size: 0.9em;
            padding: 3px 8px;
            color: #ffffff;
            background-color: #888888;
            margin-right: 0.7em;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            min-width: 28px;
            max-width: 32px;
        }

        span.delay_minutes {
             color: #e2001a;
        }

        .no-departures {
            padding: 8px 16px;
            color: var(--secondary-text-color);
            font-style: italic;
        }

        tr.cancelled {
            opacity: 0.6;
        }

        .cancelled-badge {
            color: #e2001a;
            font-weight: bold;
            font-size: 0.85em;
        }

        span.S, span.A{
            background-color: #009252;
            border-radius: 999px;
        }

        span.U {
            border-radius: 0px;
        }

        span.Bus, span.XpressBus, span.Schnellbus, span.NachtBus {
            background-color: #e2001a;
            clip-path: polygon(20% 0, 80% 0, 100% 50%, 80% 100%, 20% 100%, 0 50%);
        }

        span.XpressBus {
            background-color: #1a962b;
        }

        span.NachtBus {
            background-color: #000000;
        }

        span.Schiff {
            background-color: #009dd1;
            clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
        }

        span.ICE, span.EC, span.IC {
            background: linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #e0e0e0 100%);
            color: #666666;
            border-radius: 4px;
            font-style: italic;
        }

        span.RE, span.RB, span.R {
            background: linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #e0e0e0 100%);
            color: #000;
            border-radius: 4px;
        }

        span.U1 {
            background-color: #1c6ab3;
        }

        span.U2 {
            background-color: #e2021b;
        }

        span.U3 {
            background: radial-gradient(circle, #d4c000 0%, #fddd00 100%);
        }

        span.U4 {
            background-color: #0098a1;
        }

        span.S1 {
            background-color: #0bb14c;
        }

        span.S2 {
            background-color: #b62851;
        }

        span.S3 {
            background-color: #642d91;
        }

        span.S4 {
            background-color: #BF0880;
        }

        span.S5 {
            background-color: #0094c2;
        }

        span.S7 {
            background-color: #cc771f;
        }
      `;
    }
}
customElements.define("hvv-card", HvvCard);

class HvvCardEditor extends LitElement {
    static get properties() {
        return {
            hass: {},
            _config: {}
        };
    }

    setConfig(config) {
        this._config = config;
    }

    get _entities() {
        return this._config.entities || [];
    }

    get _title() {
        return this._config.title || "HVV Departures";
    }

    get _max() {
        return this._config.max || 5;
    }

    get _show_title() {
        return this._config.show_title !== false;
    }

    get _show_name() {
        return this._config.show_name !== false;
    }

    get _show_time() {
        return this._config.show_time || false;
    }

    get _show_time_filter() {
        return this._config.show_time_filter !== false;
    }

    // filter_lines and filter_destinations stored as arrays, edited as comma-separated strings
    get _filter_lines() {
        return (this._config.filter_lines || []).join(', ');
    }

    get _filter_destinations() {
        return (this._config.filter_destinations || []).join(', ');
    }

    render() {
        if (!this.hass) {
            return html``;
        }

        // Get all HVV departure entities
        const hvvEntities = Object.keys(this.hass.states)
            .filter(entityId => {
                const state = this.hass.states[entityId];
                return state.attributes && state.attributes.next !== undefined;
            })
            .sort();

        return html`
            <div class="card-config">
                <div class="config-row">
                    <label>Title</label>
                    <input
                        type="text"
                        .value="${this._title}"
                        @input="${this._valueChanged}"
                        .configValue="${"title"}"
                    />
                </div>

                <div class="config-row">
                    <label>Max Departures</label>
                    <input
                        type="number"
                        min="1"
                        max="20"
                        .value="${this._max}"
                        @input="${this._valueChanged}"
                        .configValue="${"max"}"
                    />
                </div>

                <div class="config-row">
                    <label>Entities</label>
                    <div class="entities-list">
                        ${this._entities.map((entity, index) => {
                            const entityId = typeof entity === 'string' ? entity : entity.entity;
                            return html`
                                <div class="entity-row">
                                    <select
                                        .value="${entityId}"
                                        @change="${(e) => this._entityChanged(e, index)}"
                                    >
                                        <option value="">Select entity...</option>
                                        ${hvvEntities.map(e => html`
                                            <option value="${e}" ?selected="${e === entityId}">${e}</option>
                                        `)}
                                    </select>
                                    <button class="remove-btn" @click="${() => this._removeEntity(index)}">✕</button>
                                </div>
                            `;
                        })}
                        <button class="add-btn" @click="${this._addEntity}">+ Add Entity</button>
                    </div>
                </div>

                <div class="config-row">
                    <label>Filter Lines <span class="hint">(comma-separated, e.g. S1, U3, 25)</span></label>
                    <input
                        type="text"
                        placeholder="Leave empty to show all lines"
                        .value="${this._filter_lines}"
                        @input="${this._filterLinesChanged}"
                    />
                </div>

                <div class="config-row">
                    <label>Filter Destinations <span class="hint">(comma-separated, partial match)</span></label>
                    <input
                        type="text"
                        placeholder="Leave empty to show all destinations"
                        .value="${this._filter_destinations}"
                        @input="${this._filterDestinationsChanged}"
                    />
                </div>

                <div class="config-row switches">
                    <label class="switch-label">
                        <input
                            type="checkbox"
                            .checked="${this._show_title}"
                            @change="${this._valueChanged}"
                            .configValue="${"show_title"}"
                        />
                        Show Title
                    </label>

                    <label class="switch-label">
                        <input
                            type="checkbox"
                            .checked="${this._show_name}"
                            @change="${this._valueChanged}"
                            .configValue="${"show_name"}"
                        />
                        Show Station Name
                    </label>

                    <label class="switch-label">
                        <input
                            type="checkbox"
                            .checked="${this._show_time}"
                            @change="${this._valueChanged}"
                            .configValue="${"show_time"}"
                        />
                        Show Absolute Time
                    </label>

                    <label class="switch-label">
                        <input
                            type="checkbox"
                            .checked="${this._show_time_filter}"
                            @change="${this._valueChanged}"
                            .configValue="${"show_time_filter"}"
                        />
                        Show Time Filter
                    </label>
                </div>
            </div>
        `;
    }

    _filterLinesChanged(ev) {
        const raw = ev.target.value;
        const arr = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
        this._config = { ...this._config, filter_lines: arr };
        this._fireConfigChanged();
    }

    _filterDestinationsChanged(ev) {
        const raw = ev.target.value;
        const arr = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
        this._config = { ...this._config, filter_destinations: arr };
        this._fireConfigChanged();
    }

    _valueChanged(ev) {
        if (!this._config || !this.hass) {
            return;
        }

        const target = ev.target;
        const configValue = target.configValue;

        let newValue;
        if (target.type === "checkbox") {
            newValue = target.checked;
        } else if (target.type === "number") {
            newValue = parseInt(target.value, 10);
        } else {
            newValue = target.value;
        }

        if (this._config[configValue] === newValue) {
            return;
        }

        const newConfig = { ...this._config };
        if (newValue === "" || newValue === undefined) {
            delete newConfig[configValue];
        } else {
            newConfig[configValue] = newValue;
        }

        this._config = newConfig;
        this._fireConfigChanged();
    }

    _entityChanged(ev, index) {
        const newValue = ev.target.value;
        const newEntities = [...this._entities];
        
        if (newValue === "") {
            newEntities.splice(index, 1);
        } else {
            newEntities[index] = newValue;
        }

        this._config = { ...this._config, entities: newEntities };
        this._fireConfigChanged();
    }

    _addEntity() {
        const newEntities = [...this._entities, ""];
        this._config = { ...this._config, entities: newEntities };
        this._fireConfigChanged();
    }

    _removeEntity(index) {
        const newEntities = [...this._entities];
        newEntities.splice(index, 1);
        this._config = { ...this._config, entities: newEntities };
        this._fireConfigChanged();
    }

    _fireConfigChanged() {
        const event = new CustomEvent("config-changed", {
            detail: { config: this._config },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    static get styles() {
        return css`
            .card-config {
                padding: 16px;
            }

            .config-row {
                margin-bottom: 16px;
            }

            .config-row > label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: var(--primary-text-color);
            }

            .hint {
                font-weight: normal;
                font-size: 0.85em;
                color: var(--secondary-text-color);
            }

            .config-row input[type="text"],
            .config-row input[type="number"] {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                background: var(--card-background-color, #fff);
                color: var(--primary-text-color);
                font-size: 14px;
                box-sizing: border-box;
            }

            .config-row input:focus {
                outline: none;
                border-color: var(--primary-color);
            }

            .entities-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .entity-row {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .entity-row select {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                background: var(--card-background-color, #fff);
                color: var(--primary-text-color);
                font-size: 14px;
            }

            .remove-btn {
                padding: 8px 12px;
                border: none;
                border-radius: 4px;
                background: var(--error-color, #db4437);
                color: white;
                cursor: pointer;
                font-size: 14px;
            }

            .remove-btn:hover {
                opacity: 0.8;
            }

            .add-btn {
                padding: 8px 16px;
                border: 1px dashed var(--divider-color, #e0e0e0);
                border-radius: 4px;
                background: transparent;
                color: var(--primary-color);
                cursor: pointer;
                font-size: 14px;
            }

            .add-btn:hover {
                background: var(--primary-color);
                color: white;
                border-style: solid;
            }

            .switches {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .switch-label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-weight: normal;
            }

            .switch-label input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }
        `;
    }
}

customElements.define("hvv-card-editor", HvvCardEditor);
