import L from 'leaflet';
require('leaflet.path.drag');
require('leaflet-editable');

/**
 * Leaflet Image Mapper
 */
export default class Limapper {
  /**
   * initialize object
   * @return {object} Instance
   */
  constructor() {
    this._name = 'Limapper';
    this._items = [];
  }

  /**
   * get name
   * @return {string} name
   */
  get name() {
    return this._name;
  }

  /**
   * get items
   * @return {Array} list of items
   */
  get items() {
    if (!this._map) {
      return [];
    }

    let items = [];
    let map = this._map;
    let origin = map.latLngToLayerPoint(new L.LatLng(0, 0));

    this._items.forEach((v, k) => {
      v.pxpoints = [];
      v._latlngs[0].forEach((p, k2) =>{
        let p2 = map.latLngToLayerPoint(p);

        v.pxpoints.push({x: p2.x - origin.x, y: p2.y - origin.y });
      });

      items.push(v);
    });

    return items;
  }

  /**
   * initialize object
   * @param  {object} opts options
   * @return {object}      self
   */
  init(opts) {
    let self = this;
    let defs = {
      minZoom: 1,
      maxZoom: 5,
      center: [0, 0],
      zoom: 1,
      editable: true,
      crs: L.CRS.Simple
    };
    let southWest, northEast, bounds, map;

    // apply defaults
    for (let k in defs) {
      opts[k] = opts[k] || defs[k];
    }
    map = L.map(opts.elid || 'map', opts);
    southWest = map.unproject([0, opts.imageHeight]);
    northEast = map.unproject([opts.imageWidth, 0]);
    bounds = new L.LatLngBounds(southWest, northEast);
    L.imageOverlay(opts.imageUrl, bounds).addTo(map);
    map.setMaxBounds(bounds);
    this._map = map;

    L.EditControl = L.Control.extend({
      options: {
        position: 'topleft',
        callback: null,
        kind: '',
        html: ''
      },
      onAdd: function (map) {
        let container = L.DomUtil.create('div', 'leaflet-control leaflet-bar'),
          link = L.DomUtil.create('a', '', container);

        link.href = '#';
        link.title = 'Create a new ' + this.options.kind;
        link.innerHTML = this.options.html;
        L.DomEvent
          .on(link, 'click', L.DomEvent.stop)
          .on(link, 'click', function () {
            window.LAYER = this.options.callback.call(map.editTools);
          }, this);
        return container;
      }
    });

    map.on('layeradd', (e) => {
      if (e.layer instanceof L.EditControl) {
        self._items.push(e.layer);
        setTimeout(() => {
          self.items();
        }, 100);
      }
    });

    L.NewRectangleControl = L.EditControl.extend({
      options: {
        position: 'topleft',
        callback: map.editTools.startRectangle,
        kind: 'rectangle',
        html: '⬛'
      }
    });

    map.addControl(new L.NewRectangleControl());

    return self;
  }
}
