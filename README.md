# HVV Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://github.com/custom-components/hacs)
[![release badge](https://img.shields.io/github/v/release/nilstgmd/hvv-card.svg?style=for-the-badge)](https://github.com/nilstgmd/hvv-card/releases)

HVV departures card for Home Assistant.

This custom UI card shows the next departures at a certain station based on the [HVV Departures integration](https://www.home-assistant.io/integrations/hvv_departures).

![HVV Card dark](https://github.com/nilstgmd/hvv-card/blob/main/hvv-card.png)
![HVV Card light](https://github.com/nilstgmd/hvv-card/blob/main/hvv-card-light.png)


## Installation

### Prerequisite

Install the [HVV Departures integration](https://www.home-assistant.io/integrations/hvv_departures) and setup a departure sensor, e.g. `sensor.departures_at_jungfernstieg`.

### HACS

HVV Card is available as a custom HACS repository. This is the recommended way to install the custom cards.

1. Open HACS and add this repository to your "Custom repositories".
1. "HVV Departure Card" will show up in the "Frontend" section
1. Click "Install" and continue to configure a card

### Manual

1. Download the [hvv-card.js](https://raw.githubusercontent.com/nilstgmd/hvv-card/main/hvv-card.js) to `/config/www/`.
1. Add the following to resources in your Lovelace config or use the [Lovelace configuration UI](https://developers.home-assistant.io/docs/frontend/custom-ui/registering-resources/).:

```yaml
resources:
  - url: /local/hvv-card.js
    type: module
```

### Configuration

Add a card with type `custom:hvv-card`:

```yaml
type: 'custom:hvv-card'
entities:
  - sensor.departures_at_jungfernstieg
  - sensor.departures_at_schlump
```

#### Options

| Name | Type | Default | Since | Description |
|------|------|---------|-------|-------------|
| type | string | **required** | v0.1.0 | `custom:hvv-card` |
| entities | array | **required** | v0.2.0 | Array of entity_ids from the HVV departures integration, that will be shown on the card. |
| title | string | optional (Default: HVV Departures) | v0.2.0 | Title shown on the card. |
| show_title | boolean | optional (Default: true) | v0.2.0 | Shows the title of the card |
| max | int | optional (Default: 5) | v0.1.0 | Set the max. listed departures |
| show_time | boolean | optional (Default: false) | v0.1.7 | Shows the departure time instead of the minutes |
| show_name | boolean | optional (Default: true) | v0.2.0 | Shows the name of the departure sensor |

#### Example

Here is a more exhaustive example of a configuration:

```yaml
type: custom:hvv-card
entities:
  - sensor.departures_at_jungfernstieg
  - sensor.departures_at_schlump
max: 10
show_time: false
show_title: true
show_name: false
title: HVV
```

## Development

Install dependencies and run the tests with:

```bash
npm install
=======
Run the tests with:
npm test
```
