require('leaflet.path.drag')
require('leaflet-editable')

/**
 * Leaflet Image Mapper
 */
class Limapper {
  /**
   * Initialize an instance of Limapper
   *
   * @return an instance of Limapper
   */
  constructor(leaflet) {
    const that = this
    that._name         = 'limapper'
    that._latestItem   = null
    that._selectedItem = null
    that._identity     = 1
    that.L             = leaflet || window.L
  }

  /**
   * get name
   * @return {string} name
   */
  get name() {
    return this._name
  }

  /**
   * get item mapped data
   * @param  {object} item
   * @return {object}      item or null if no data found
   */
  getMapData(item) {
    const that = this
    let v = item

    if (!that._map) {
      return null
    }

    let map = that._map
    let po = map.latLngToLayerPoint(new that.L.LatLng(0, 0))

    // handle rectangle
    if (v.editor instanceof that.L.Editable.RectangleEditor) {
      if (v._bounds) {
        if (!v.mapdata) {
          v.mapdata = {rect: {}}
        }
        let nw = map.latLngToLayerPoint(v._bounds.getNorthWest())
        let se = map.latLngToLayerPoint(v._bounds.getSouthEast())

        v.mapdata.rect.x1 = nw.x - po.x
        v.mapdata.rect.x2 = se.x - po.x
        v.mapdata.rect.y1 = nw.y - po.y
        v.mapdata.rect.y2 = se.y - po.y
        return v
      }
    }
    return null
  }

  /**
   * initialize object
   * @param  {object} opts options
   * @return {object}      self
   */
  init(opts) {
    const that = this
    const defs = {
      minZoom: 1,
      maxZoom: 5,
      center: [0, 0],
      zoom: 1,
      editable: true,
      crs: that.L.CRS.Simple
    }
    let southWest, northEast, bounds, map, layerPopup

    // apply defaults
    for (let k in defs) {
      opts[k] = opts[k] || defs[k]
    }
    map = that.L.map(opts.elid || 'map', opts)
    southWest = map.unproject([0, opts.imageHeight])
    northEast = map.unproject([opts.imageWidth, 0])
    bounds = new that.L.LatLngBounds(southWest, northEast)
    that.L.imageOverlay(opts.imageUrl, bounds).addTo(map)
    map.setMaxBounds(bounds)
    that._map = map

    // add new edit control with behavior
    that.L.EditControl = that.L.Control.extend({
      options: {
        position: 'topleft',
        callback: null,
        kind: '',
        html: ''
      },
      onAdd: function (map) {
        const container = that.L.DomUtil.create('div', 'leaflet-control leaflet-bar'),
          link = that.L.DomUtil.create('a', '', container)

        link.href = '#'
        link.title = 'Create a new ' + this.options.kind
        link.innerHTML = this.options.html
        that.L.DomEvent
          .on(link, 'click', L.DomEvent.stop)
          .on(link, 'click', function () {
            window.LAYER = this.options.callback.call(map.editTools)
          }, this)

        return container
      }
    })

    // now create the rectangle control
    that.L.NewRectangleControl = that.L.EditControl.extend({
      options: {
        position: 'topleft',
        callback: map.editTools.startRectangle,
        kind: 'rect',
        html: '⬛'
      }
    })

    // add the control to map
    map.addControl(new that.L.NewRectangleControl())

    // handle new item
    map.on('layeradd', (e) => {
      if (e.layer instanceof that.L.Path) {
        let item = e.layer

        that._latestItem = item
        item.mapdata = {name: `Item #${that._identity++}` }
        item.on('dblclick', that.L.DomEvent.stop).on('dblclick', item.toggleEdit)
        item.on('mouseover', (e) => {
          if (map && item.mapdata) {
            layerPopup = that.L.popup()
            .setLatLng(e.latlng)
            .setContent(item.mapdata.name)
            .openOn(map)
          }
        })

        item.on('mouseout', (e) => {
          if (layerPopup && map) {
            map.closePopup(layerPopup)
            layerPopup = null
          }
        })
      }
    })

    return self
  }

  /**
   * get items
   * @return {Array} list of items
   */
  get items() {
    const that = this
    const items = []

    if (!that._map) {
      return items
    }

    that._map.eachLayer((v, k) => {
      if (that.getData(v)) {
        items.push(v)
      }
    })

    return items
  }

  /**
   * get last item added
   * @return {object} last item added
   */
  get latestItem() {
    return this.getMapData(this._latestItem)
  }

  p2ll(x, y) {
    return this._map.containerPointToLatLng([x, y])
  }

  /**
   * add a single pixel coordinates item
   * @param {object} mapData item map data
   */
  addItem(mapData) {
    const that = this
    const rect = mapData.rect

    var layer = that.L.rectangle(
      [that.p2ll(rect.x1, rect.y1), that.p2ll(rect.x2, rect.y2)]
    ).addTo(that._map)

    layer.enableEdit()
    return layer
  }

  addItems(items) {
    const that = this
    const rst = []

    items.forEach(i => {
      const it = that.addItem(i)

      rst.push(it)
    })

    return it
  }

  /**
   * remove item
   * @param {object} item the map data item
   */
  removeItem(item) {
    if (item && item.remove) {
      item.remove()
    }
  }
}

export default Limapper
