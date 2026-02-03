# HVV Departure Card

A beautiful custom Lovelace card for displaying Hamburg public transit (HVV) departures in Home Assistant.

## Features

- **Real-time departures** with line, direction, and time
- **Delay information** displayed in red when trains/buses are running late
- **Cancelled departures** shown with strikethrough and "Cancelled" badge
- **Smart sorting** by actual arrival time (scheduled time + delay)
- **Time filter** to show departures after a specified offset
- **Multiple stations** support in a single card
- **HVV styling** with official line colors (U-Bahn, S-Bahn, Bus, etc.)

## Requirements

- Home Assistant 2024.1.0 or newer
- [HVV Departures Integration](https://www.home-assistant.io/integrations/hvv_departures) configured

## Quick Start

```yaml
type: custom:hvv-card
entities:
  - sensor.departures_at_jungfernstieg
```

## Screenshots

![HVV Card Dark](https://github.com/nilstgmd/hvv-card/blob/main/hvv-card.png)
![HVV Card Light](https://github.com/nilstgmd/hvv-card/blob/main/hvv-card-light.png)

## Documentation

See the [README](https://github.com/nilstgmd/hvv-card) for full documentation and configuration options.
