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
});
