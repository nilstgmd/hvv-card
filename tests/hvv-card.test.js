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
});
