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
    this._latestItem = null;
    this._selectedItem = null;
    this._identity = 1;
  }

  /**
   * get name
   * @return {string} name
   */
  get name() {
    return this._name;
  }

  /**
   * get item mapped data
   * @param  {object} item
   * @return {object}      item or null if no data found
   */
  getMapData(item) {
    let self = this;
    let v = item;

    if (!self._map) {
      return null;
    }

    let map = self._map;
    let po = map.latLngToLayerPoint(new L.LatLng(0, 0));

    // handle rectangle
    if (v.editor instanceof L.Editable.RectangleEditor) {
      if (v._bounds) {
        if (!v.mapdata) {
          v.mapdata = {rect: {}};
        }
        let nw = map.latLngToLayerPoint(v._bounds.getNorthWest());
        let se = map.latLngToLayerPoint(v._bounds.getSouthEast());

        v.mapdata.rect.x1 = nw.x - po.x;
        v.mapdata.rect.x2 = se.x - po.x;
        v.mapdata.rect.y1 = nw.y - po.y;
        v.mapdata.rect.y2 = se.y - po.y;
        return v;
      }
    }
    return null;
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
    let southWest, northEast, bounds, map, layerPopup;

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

    // add new edit control with behavior
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

    // now create the rectangle control
    L.NewRectangleControl = L.EditControl.extend({
      options: {
        position: 'topleft',
        callback: map.editTools.startRectangle,
        kind: 'rect',
        html: '⬛'
      }
    });

    // add the control to map
    map.addControl(new L.NewRectangleControl());

    // handle new item
    map.on('layeradd', (e) => {
      if (e.layer instanceof L.Path) {
        let item = e.layer;

        self._latestItem = item;
        item.mapdata = {name: `Item #${self._identity++}` };
        item.on('dblclick', L.DomEvent.stop).on('dblclick', item.toggleEdit);
        item.on('mouseover', (e) => {
          if (map && item.mapdata) {
            layerPopup = L.popup()
            .setLatLng(e.latlng)
            .setContent(item.mapdata.name)
            .openOn(map);
          }
        });

        item.on('mouseout', (e) => {
          if (layerPopup && map) {
            map.closePopup(layerPopup);
            layerPopup = null;
          }
        });
      }
    });

    return self;
  }

  /**
   * get items
   * @return {Array} list of items
   */
  get items() {
    let self = this;
    let items = [];

    if (!self._map) {
      return items;
    }

    self._map.eachLayer((v, k) => {
      if (self.getData(v)) {
        items.push(v);
      }
    });

    return items;
  }

  /**
   * get last item added
   * @return {object} last item added
   */
  get latestItem() {
    return this.getMapData(this._latestItem);
  }

  /**
   * add a single pixel coordinates item
   * @param {object} mapData item map data
   */
  addPixelItem(mapData) {
    return null;
  }
}
