# HVV Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://github.com/custom-components/hacs)
[![release badge](https://img.shields.io/github/v/release/nilstgmd/hvv-card.svg?style=for-the-badge)](https://github.com/nilstgmd/hvv-card/releases)
[![validate](https://img.shields.io/github/actions/workflow/status/nilstgmd/hvv-card/validate.yml?label=validate&style=for-the-badge)](https://github.com/nilstgmd/hvv-card/actions/workflows/validate.yml)

HVV departures card for Home Assistant.

This custom UI card shows the next departures at a certain station based on the [HVV Departures integration](https://www.home-assistant.io/integrations/hvv_departures).

![HVV Card dark](https://github.com/nilstgmd/hvv-card/blob/main/hvv-card.png)
![HVV Card light](https://github.com/nilstgmd/hvv-card/blob/main/hvv-card-light.png)

## Features

- **Visual Configuration Editor** - Configure the card through the UI without writing YAML
- Displays upcoming departures with line, direction, and time
- Departures sorted by actual arrival time (scheduled time + delay)
- Delay information displayed in red when trains/buses are running late
- Cancelled departures shown with strikethrough and "Cancelled" badge
- Graceful handling when no departures are available ("No departures" message)
- Time filter to show departures after a specified offset
- Support for multiple stations in a single card
- Visual styling matching HVV line colors (U-Bahn, S-Bahn, Bus, etc.)


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

#### Visual Editor

The easiest way to configure the card is through the visual editor:

1. Add a new card to your dashboard
2. Search for "HVV" or "Custom: HVV Card"
3. Use the visual editor to configure entities and options

#### YAML Configuration

Alternatively, add a card with type `custom:hvv-card`:

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
| show_time_filter | boolean | optional (Default: true) | v0.3.0 | Shows the time filter input that allows filtering departures by a future time offset in minutes |

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
show_time_filter: true
title: HVV
```

## Development

Install dependencies and run the tests with:

```bash
npm install
npm test
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup
- Branch naming conventions
- Commit message format (Conventional Commits)
- Pull request process

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
