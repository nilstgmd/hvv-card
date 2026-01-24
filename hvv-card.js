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

        return html `
             <ha-card>
                <div class="header-row">
                    ${showTitle ?
                        html`<h1 class="card-header">${title}</h1>`
                        : html`<span></span>`
                    }
                    <div class="time-control">
                        <label>in</label>
                        <input type="number" min="0" max="120" 
                               .value="${this._timeOffset}" 
                               @change="${this._onTimeOffsetChange}">
                        <span>min</span>
                    </div>
                </div>

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

                    const today = new Date();
                    const offsetMs = this._timeOffset * 60 * 1000;
                    const referenceTime = new Date(today.getTime() + offsetMs);
                    const max = this._config.max ? this._config.max : 5;
                    var count = 0;

                    return html `
                    <div>
                        ${showName && displayName
                        ? html`
                            <h2 style="padding-left: 16px;">${displayName}</h2>
                            `
                        : ""
                        }
                        <table>
                            ${stateObj.attributes['next'].map(attr => {
                                const direction = attr['direction'];
                                const line = attr['line'];
                                const type = attr['type'];
                                const delay_seconds = attr['delay'];
                                const delay_minutes = (delay_seconds / 60);
                                const departure = new Date(attr["departure"]);
                                
                                // Filter out departures before the reference time
                                if (departure < referenceTime) {
                                    return html``;
                                }
                                
                                const diffMs = departure - today;
                                const departureHours = Math.floor((diffMs / (1000*60*60)) % 24);
                                const departureMins = Math.round((diffMs / (1000*60)) % 60);

                                count++;

                                return count <= max
                                ? html`
                                    <tr>
                                        <td class="narrow" style="text-align:center;"><span class="line ${type} ${line}">${line}</span></td>
                                        <td class="expand">${direction}</td>
                                        <td class="narrow" style="text-align:right;">
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
                                        </td>
                                    </tr>
                                    `
                                : html ``;
                            })}
                        </table>
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
