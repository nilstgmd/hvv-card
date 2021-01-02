# HVV Card
HVV departures card for Home Assistant.

This custom UI card shows the next departures at a certain station based on the [HVV Departures integration](https://www.home-assistant.io/integrations/hvv_departures).

![HVV Card](https://github.com/nilstgmd/hvv-card/blob/main/hvv-card.png)

## Installation

0. Install the [HVV Departures integration](https://www.home-assistant.io/integrations/hvv_departures) and setup a departure sensor, e.g. `sensor.departures_at_jungfernstieg`.
1. Download the [hvv-card.js](https://raw.githubusercontent.com/nilstgmd/hvv-card/0.1.0/src/hvv-card.js) to `/config/www/`.
2. Add the following to resources in your lovelace config or use the [Lovelace configuration UI](https://developers.home-assistant.io/docs/frontend/custom-ui/registering-resources/).:

```yaml
resources:
  - url: /local/hvv-card.js
    type: module
```

### Configuration

Add a card with type `custom:hvv-card`:

```yaml
type: 'custom:hvv-card'
entity: sensor.departures_at_jungfernstieg
max: (Optional) 10
```

#### Options

| Name | Type | Default | Since | Description |
|------|------|---------|-------|-------------|
| type | string | **required** | v0.1.0 | `custom:hvv-card`
| entity | string | **required** | v0.1.0 | The entity_id from the HVV departures integration.
| max | int | optional (Default: 5) | v0.1.0 | Set the max. listed departures
