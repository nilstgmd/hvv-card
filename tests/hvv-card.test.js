// jest setup using jsdom environment

describe('hvv-card custom element', () => {
  beforeAll(() => {
    // stub customElements and base element used by hvv-card
    class MockLitElement extends HTMLElement {}
    // minimal html/css template functions
    MockLitElement.prototype.html = (strings, ...vals) => {
      let out = '';
      for (let i = 0; i < strings.length; i++) {
        out += strings[i];
        if (i < vals.length) {
          let v = vals[i];
          if (Array.isArray(v)) v = v.join('');
          out += v;
        }
      }
      return out;
    };
    MockLitElement.prototype.css = MockLitElement.prototype.html;

    class HaPanelLovelace extends MockLitElement {}
    customElements.define('ha-panel-lovelace', HaPanelLovelace);
  });

  test('defines hvv-card element', () => {
    require('../hvv-card.js');
    expect(customElements.get('hvv-card')).toBeDefined();
  });

  test('render shows unavailable warning icon', () => {
    require('../hvv-card.js');
    const card = document.createElement('hvv-card');
    card.setConfig({ entities: ['sensor.unavail'] });
    card.hass = {
      states: {
        'sensor.unavail': {
          state: 'unavailable',
          attributes: { friendly_name: 'Test Entity' }
        }
      }
    };

    const output = card.render();
    expect(String(output)).toContain('mdi:vector-polyline-remove');
  });

  describe('time filter', () => {
    function createCardWithDepartures(departures, config = {}) {
      const card = document.createElement('hvv-card');
      card.setConfig({ entities: ['sensor.departures'], ...config });
      card.hass = {
        states: {
          'sensor.departures': {
            state: 'ok',
            attributes: {
              friendly_name: 'Test Station',
              next: departures
            }
          }
        }
      };
      return card;
    }

    test('initializes _timeOffset to 0 by default', () => {
      require('../hvv-card.js');
      const card = document.createElement('hvv-card');
      expect(card._timeOffset).toBe(0);
    });

    test('shows time filter control by default', () => {
      require('../hvv-card.js');
      const card = createCardWithDepartures([]);
      const output = String(card.render());
      expect(output).toContain('time-control');
      expect(output).toContain('type="number"');
    });

    test('hides time filter control when show_time_filter is false', () => {
      require('../hvv-card.js');
      const card = createCardWithDepartures([], { show_time_filter: false });
      const output = String(card.render());
      expect(output).not.toContain('time-control');
    });

    test('shows time filter control when show_time_filter is true', () => {
      require('../hvv-card.js');
      const card = createCardWithDepartures([], { show_time_filter: true });
      const output = String(card.render());
      expect(output).toContain('time-control');
    });

    test('shows all departures when timeOffset is 0', () => {
      require('../hvv-card.js');
      const now = new Date();
      const departures = [
        { line: 'U1', direction: 'Hauptbahnhof', type: 'U', delay: 0, departure: new Date(now.getTime() + 5 * 60000).toISOString() },
        { line: 'U2', direction: 'Niendorf', type: 'U', delay: 0, departure: new Date(now.getTime() + 10 * 60000).toISOString() },
        { line: 'S1', direction: 'Altona', type: 'S', delay: 0, departure: new Date(now.getTime() + 15 * 60000).toISOString() }
      ];
      const card = createCardWithDepartures(departures);
      card._timeOffset = 0;

      const output = String(card.render());
      expect(output).toContain('Hauptbahnhof');
      expect(output).toContain('Niendorf');
      expect(output).toContain('Altona');
    });

    test('filters out departures before timeOffset', () => {
      require('../hvv-card.js');
      const now = new Date();
      const departures = [
        { line: 'U1', direction: 'Hauptbahnhof', type: 'U', delay: 0, departure: new Date(now.getTime() + 5 * 60000).toISOString() },
        { line: 'U2', direction: 'Niendorf', type: 'U', delay: 0, departure: new Date(now.getTime() + 10 * 60000).toISOString() },
        { line: 'S1', direction: 'Altona', type: 'S', delay: 0, departure: new Date(now.getTime() + 15 * 60000).toISOString() }
      ];
      const card = createCardWithDepartures(departures);
      card._timeOffset = 8; // Filter out departures in less than 8 minutes

      const output = String(card.render());
      expect(output).not.toContain('Hauptbahnhof'); // 5 min away, should be filtered
      expect(output).toContain('Niendorf'); // 10 min away, should show
      expect(output).toContain('Altona'); // 15 min away, should show
    });

    test('filters out all departures when timeOffset exceeds all', () => {
      require('../hvv-card.js');
      const now = new Date();
      const departures = [
        { line: 'U1', direction: 'Hauptbahnhof', type: 'U', delay: 0, departure: new Date(now.getTime() + 5 * 60000).toISOString() },
        { line: 'U2', direction: 'Niendorf', type: 'U', delay: 0, departure: new Date(now.getTime() + 10 * 60000).toISOString() }
      ];
      const card = createCardWithDepartures(departures);
      card._timeOffset = 20; // Filter out all departures

      const output = String(card.render());
      expect(output).not.toContain('Hauptbahnhof');
      expect(output).not.toContain('Niendorf');
    });

    test('_onTimeOffsetChange updates _timeOffset from event', () => {
      require('../hvv-card.js');
      const card = document.createElement('hvv-card');
      card.setConfig({ entities: ['sensor.test'] });

      const mockEvent = { target: { value: '15' } };
      card._onTimeOffsetChange(mockEvent);

      expect(card._timeOffset).toBe(15);
    });

    test('_onTimeOffsetChange handles non-numeric input gracefully', () => {
      require('../hvv-card.js');
      const card = document.createElement('hvv-card');
      card.setConfig({ entities: ['sensor.test'] });

      const mockEvent = { target: { value: 'invalid' } };
      card._onTimeOffsetChange(mockEvent);

      expect(card._timeOffset).toBe(0);
    });
  });

  describe('empty departures handling', () => {
    test('shows "No departures" when next array is empty', () => {
      require('../hvv-card.js');
      const card = document.createElement('hvv-card');
      card.setConfig({ entities: ['sensor.empty'] });
      card.hass = {
        states: {
          'sensor.empty': {
            state: 'ok',
            attributes: {
              friendly_name: 'Empty Station',
              next: []
            }
          }
        }
      };

      const output = String(card.render());
      expect(output).toContain('No departures');
      expect(output).toContain('Empty Station');
    });

    test('shows "No departures" when next attribute is missing', () => {
      require('../hvv-card.js');
      const card = document.createElement('hvv-card');
      card.setConfig({ entities: ['sensor.missing'] });
      card.hass = {
        states: {
          'sensor.missing': {
            state: 'ok',
            attributes: {
              friendly_name: 'Missing Next Station'
            }
          }
        }
      };

      const output = String(card.render());
      expect(output).toContain('No departures');
      expect(output).toContain('Missing Next Station');
    });

    test('renders other entities when one has no departures', () => {
      require('../hvv-card.js');
      const card = document.createElement('hvv-card');
      card.setConfig({ entities: ['sensor.empty', 'sensor.hasdata'] });
      const now = new Date();
      card.hass = {
        states: {
          'sensor.empty': {
            state: 'ok',
            attributes: {
              friendly_name: 'Empty Station',
              next: []
            }
          },
          'sensor.hasdata': {
            state: 'ok',
            attributes: {
              friendly_name: 'Working Station',
              next: [
                { line: 'U1', direction: 'Hauptbahnhof', type: 'U', delay: 0, departure: new Date(now.getTime() + 5 * 60000).toISOString() }
              ]
            }
          }
        }
      };

      const output = String(card.render());
      expect(output).toContain('No departures');
      expect(output).toContain('Empty Station');
      expect(output).toContain('Working Station');
      expect(output).toContain('Hauptbahnhof');
    });
  });

  describe('departure sorting by actual time', () => {
    function createCardWithDepartures(departures, config = {}) {
      const card = document.createElement('hvv-card');
      card.setConfig({ entities: ['sensor.departures'], ...config });
      card.hass = {
        states: {
          'sensor.departures': {
            state: 'ok',
            attributes: {
              friendly_name: 'Test Station',
              next: departures
            }
          }
        }
      };
      return card;
    }

    test('sorts departures by actual time when delays change order', () => {
      require('../hvv-card.js');
      const now = new Date();
      // X35 is scheduled first but has 3 min delay, so 261 should appear first
      const departures = [
        { line: 'X35', direction: 'Delayed Bus', type: 'Bus', delay: 180, departure: new Date(now.getTime() + 8 * 60000).toISOString() },
        { line: '261', direction: 'On Time Bus', type: 'Bus', delay: 0, departure: new Date(now.getTime() + 10 * 60000).toISOString() }
      ];
      const card = createCardWithDepartures(departures);
      card._timeOffset = 0;

      const output = String(card.render());
      // 261 should appear before X35 because:
      // X35 actual: 8min + 3min delay = 11min
      // 261 actual: 10min + 0 delay = 10min
      const onTimeIndex = output.indexOf('On Time Bus');
      const delayedIndex = output.indexOf('Delayed Bus');
      expect(onTimeIndex).toBeLessThan(delayedIndex);
    });

    test('maintains order when no delays affect sorting', () => {
      require('../hvv-card.js');
      const now = new Date();
      const departures = [
        { line: 'U1', direction: 'First', type: 'U', delay: 0, departure: new Date(now.getTime() + 5 * 60000).toISOString() },
        { line: 'U2', direction: 'Second', type: 'U', delay: 0, departure: new Date(now.getTime() + 10 * 60000).toISOString() },
        { line: 'U3', direction: 'Third', type: 'U', delay: 0, departure: new Date(now.getTime() + 15 * 60000).toISOString() }
      ];
      const card = createCardWithDepartures(departures);
      card._timeOffset = 0;

      const output = String(card.render());
      const firstIndex = output.indexOf('First');
      const secondIndex = output.indexOf('Second');
      const thirdIndex = output.indexOf('Third');
      expect(firstIndex).toBeLessThan(secondIndex);
      expect(secondIndex).toBeLessThan(thirdIndex);
    });

    test('sorts correctly with multiple delayed departures', () => {
      require('../hvv-card.js');
      const now = new Date();
      // All buses have delays that reorder them
      const departures = [
        { line: 'A', direction: 'Bus A', type: 'Bus', delay: 600, departure: new Date(now.getTime() + 5 * 60000).toISOString() },  // actual: 15min
        { line: 'B', direction: 'Bus B', type: 'Bus', delay: 120, departure: new Date(now.getTime() + 7 * 60000).toISOString() },  // actual: 9min
        { line: 'C', direction: 'Bus C', type: 'Bus', delay: 0, departure: new Date(now.getTime() + 12 * 60000).toISOString() }    // actual: 12min
      ];
      const card = createCardWithDepartures(departures);
      card._timeOffset = 0;

      const output = String(card.render());
      // Expected order by actual time: B (9min), C (12min), A (15min)
      const busAIndex = output.indexOf('Bus A');
      const busBIndex = output.indexOf('Bus B');
      const busCIndex = output.indexOf('Bus C');
      expect(busBIndex).toBeLessThan(busCIndex);
      expect(busCIndex).toBeLessThan(busAIndex);
    });

    test('handles missing delay field gracefully', () => {
      require('../hvv-card.js');
      const now = new Date();
      const departures = [
        { line: 'U1', direction: 'No Delay Field', type: 'U', departure: new Date(now.getTime() + 10 * 60000).toISOString() },
        { line: 'U2', direction: 'With Delay', type: 'U', delay: 0, departure: new Date(now.getTime() + 5 * 60000).toISOString() }
      ];
      const card = createCardWithDepartures(departures);
      card._timeOffset = 0;

      const output = String(card.render());
      // U2 at 5min should come before U1 at 10min
      const noDelayIndex = output.indexOf('No Delay Field');
      const withDelayIndex = output.indexOf('With Delay');
      expect(withDelayIndex).toBeLessThan(noDelayIndex);
    });
  });

  describe('cancelled departures', () => {
    function createCardWithDepartures(departures, config = {}) {
      const card = document.createElement('hvv-card');
      card.setConfig({ entities: ['sensor.departures'], ...config });
      card.hass = {
        states: {
          'sensor.departures': {
            state: 'ok',
            attributes: {
              friendly_name: 'Test Station',
              next: departures
            }
          }
        }
      };
      return card;
    }

    test('displays cancelled badge for cancelled departures', () => {
      require('../hvv-card.js');
      const now = new Date();
      const departures = [
        { line: 'U1', direction: 'Cancelled Train', type: 'U', delay: 0, cancelled: true, departure: new Date(now.getTime() + 5 * 60000).toISOString() }
      ];
      const card = createCardWithDepartures(departures);
      card._timeOffset = 0;

      const output = String(card.render());
      expect(output).toContain('cancelled-badge');
      expect(output).toContain('Cancelled');
    });

    test('shows strikethrough for cancelled departure direction', () => {
      require('../hvv-card.js');
      const now = new Date();
      const departures = [
        { line: 'U1', direction: 'Cancelled Train', type: 'U', delay: 0, cancelled: true, departure: new Date(now.getTime() + 5 * 60000).toISOString() }
      ];
      const card = createCardWithDepartures(departures);
      card._timeOffset = 0;

      const output = String(card.render());
      expect(output).toContain('<s>Cancelled Train</s>');
    });

    test('applies cancelled CSS class to row', () => {
      require('../hvv-card.js');
      const now = new Date();
      const departures = [
        { line: 'U1', direction: 'Cancelled Train', type: 'U', delay: 0, cancelled: true, departure: new Date(now.getTime() + 5 * 60000).toISOString() }
      ];
      const card = createCardWithDepartures(departures);
      card._timeOffset = 0;

      const output = String(card.render());
      expect(output).toContain('class="cancelled"');
    });

    test('does not show cancelled styling for normal departures', () => {
      require('../hvv-card.js');
      const now = new Date();
      const departures = [
        { line: 'U1', direction: 'Normal Train', type: 'U', delay: 0, cancelled: false, departure: new Date(now.getTime() + 5 * 60000).toISOString() }
      ];
      const card = createCardWithDepartures(departures);
      card._timeOffset = 0;

      const output = String(card.render());
      expect(output).not.toContain('cancelled-badge');
      expect(output).not.toContain('<s>Normal Train</s>');
      expect(output).toContain('Normal Train');
    });

    test('handles missing cancelled field gracefully', () => {
      require('../hvv-card.js');
      const now = new Date();
      const departures = [
        { line: 'U1', direction: 'No Cancelled Field', type: 'U', delay: 0, departure: new Date(now.getTime() + 5 * 60000).toISOString() }
      ];
      const card = createCardWithDepartures(departures);
      card._timeOffset = 0;

      const output = String(card.render());
      expect(output).not.toContain('cancelled-badge');
      expect(output).not.toContain('<s>');
      expect(output).toContain('No Cancelled Field');
    });

    test('displays mixed cancelled and normal departures correctly', () => {
      require('../hvv-card.js');
      const now = new Date();
      const departures = [
        { line: 'U1', direction: 'Cancelled', type: 'U', delay: 0, cancelled: true, departure: new Date(now.getTime() + 5 * 60000).toISOString() },
        { line: 'U2', direction: 'Running', type: 'U', delay: 0, cancelled: false, departure: new Date(now.getTime() + 10 * 60000).toISOString() }
      ];
      const card = createCardWithDepartures(departures);
      card._timeOffset = 0;

      const output = String(card.render());
      expect(output).toContain('<s>Cancelled</s>');
      expect(output).toContain('cancelled-badge');
      expect(output).toContain('Running');
      expect(output).not.toContain('<s>Running</s>');
    });
  });
});
