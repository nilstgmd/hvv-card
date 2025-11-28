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
        if (oldHass.states[entity] !== element.hass.states[entity]) {
            return true;
        }
    }

    return false;
}

class HvvCard extends LitElement {
    static get properties() {
        return {
            _config: {},
            hass: {}
        };
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
                ${showTitle ?
                         html`
                            <h1 class="card-header">${title}</h1>
                        `
                        : ""
                    }

                ${this._config.entities.map((ent) => {
                    const stateObj = this.hass.states[ent];
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
                                Entity not available: ${ent}
                                </div>
                            </ha-card>
                            `;
                    }

                    if (stateObj.state == 'unavailable') {
                        return html`
                            <div>
                                ${showName && stateObj.attributes['friendly_name']
                                    ? html`
                                        <h2 style="padding-left: 16px;">${stateObj.attributes['friendly_name']} <ha-icon icon="mdi:vector-polyline-remove" style="color: red;"></ha-icon></h2>
                                    `
                                    : ""}
                            </div>
                        `;
                    }

                    const today = new Date();
                    const max = this._config.max ? this._config.max : 5;
                    var count = 0;

                    return html `
                    <div>
                        ${showName && stateObj.attributes['friendly_name']
                        ? html`
                            <h2 style="padding-left: 16px;">${stateObj.attributes['friendly_name']}</h2>
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
                                                departure.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) :
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
            width: 48px;
            margin-left: 0;
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
            background-color: #f00c0c;
            color: #ffffff;
            border-radius: 4px;
        }

        span.RE, span.RB, span.R {
            background-color: #ffffff;
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
            background-color: #fddd00;
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
