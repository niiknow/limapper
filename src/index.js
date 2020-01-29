import 'leaflet.path.drag'
import 'leaflet-editable'
import 'leaflet-contextmenu'
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css'

/**
 * Leaflet Image Mapper
 */
class Limapper {
  /**
   * Initialize an instance of Limapper
   *
   * @return an instance of Limapper
   */
  constructor() {
    const that         = this
    that._name         = 'limapper'
    that._latestItem   = null
    that._selectedItem = null
    that._identity     = 1
    that._editOnAdd    = false
    that._dblclickEdit = false
    that._disablePopup = false
    that.win           = window
    that.L             = that.win.L
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
    const v    = item

    if (!that._map) {
      return null
    }

    const map = that._map
    const po  = map.latLngToLayerPoint(new that.L.LatLng(0, 0))

    // handle rectangle
    if (v.mapdata && v._bounds) {
      v.mapdata = v.mapdata || { rect: {} }
      const nw = map.latLngToLayerPoint(v._bounds.getNorthWest())
      const se = map.latLngToLayerPoint(v._bounds.getSouthEast())

      v.mapdata.rect.x  = nw.x - po.x
      v.mapdata.rect.xx = se.x - po.x
      v.mapdata.rect.y  = nw.y - po.y
      v.mapdata.rect.yy = se.y - po.y

      return v
    }

    return null
  }

  /**
   * initialize object
   *
   * @param  Object opts options { elid, imageWidth, imageHeight, imageUrl }
   * @return Object      self
   */
  init(opts) {
    const that = this
    const defs = {
      minZoom: opts.minZoom || -3,
      maxZoom: opts.maxZoom || 1,
      center: [0, -1 * opts.imageWidth],
      zoom: 1,
      editable: true,
      crs: that.L.CRS.Simple
    }
    let southWest, northEast, bounds, map, layerPopup

    // apply defaults
    for (let k in defs) {
      opts[k] = opts[k] || defs[k]
    }

    map          = that.L.map(opts.elid || 'map', opts)
    southWest    = map.unproject([0, opts.imageHeight], map.getMaxZoom() - 1)
    northEast    = map.unproject([opts.imageWidth, 0], map.getMaxZoom() - 1)
    bounds       = new that.L.LatLngBounds(southWest, northEast)
    that._map    = map
    that._image  = that.L.imageOverlay(opts.imageUrl, bounds).addTo(map)
    that._bounds = bounds
    map.setMaxBounds(bounds)

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

        link.href      = '#'
        link.title     = 'New shape: ' + this.options.kind
        link.innerHTML = this.options.html
        that.L.DomEvent
          .on(link, 'click', that.L.DomEvent.stop)
          .on(link, 'click', function () {
            that.win.LAYER = this.options.callback.call(map.editTools)
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
        const item = e.layer

        that._latestItem = item
        item.mapdata     = item.mapdata || { rect: {} }
        item.$           = { id: that._identity++ }
        item.$.name      = `Item #${item.$.id}`

        // allow for double click event
        item.on('dblclick', that.L.DomEvent.stop).on('dblclick', (e) => {
          if (that._dblclickEdit) {
            item.toggleEdit()
          }

          that.onDoubleClickItem(item, e)
        })

        if (!that._disablePopup) {
          item.on('mouseover', (e) => {
            if (map && item.mapdata) {
              layerPopup = that.L.popup()
              .setLatLng(e.latlng)
              .setContent(that.renderPopup(item))
              .openOn(map)

              item.popup = layerPopup
            }
          })

          item.on('mouseout', (e) => {
            if (layerPopup && map) {
              map.closePopup(layerPopup)
              layerPopup = null
              item.popup = null
            }
          })
        }

        that.onAddItem(item)
      }
    })

    setTimeout(() => {
      map.contextmenu.showAt(that.p2ll([0,0]))
      map.contextmenu.hide()
    }, 200)


    return that
  }

  /**
   * get items
   *
   * @return Array list of items
   */
  getItems() {
    const that = this
    const items = []

    if (!that._map) {
      return items
    }

    that._map.eachLayer((v, k) => {
      // make sure we get the map data for all items
      if (that.getMapData(v)) {
        items.push(v)
      }
    })

    return items
  }

  /**
   * get last item added
   *
   * @return Object last item added
   */
  get latestItem() {
    return this.getMapData(this._latestItem)
  }

  /**
   * Convert container point to lat long
   *
   * @param  Number x point x
   * @param  Number y point y
   * @return Object  leaflet lat long object
   */
  p2ll(x, y) {
    return this._map.containerPointToLatLng([x, y])
  }

  /**
   * Called after item add using the shape tool
   *
   * @param  Object item the layer item
   * @return Object  the item
   */
  onAddItem(item) {
    return item
  }


  /**
   * Called before add of item to layer
   *
   * @param  Object item the layer item
   * @return Object  the item
   */
  onAddingItem(item) {
    return item
  }

  /**
   * Handle item double click
   *
   * @param  Object item  item
   * @param  Object event event
   * @return Object   the item
   */
  onDoubleClickItem(item, event) {
    return item
  }

  /**
   * add a single pixel coordinates item
   *
   * @param Object mapData item map data
   * @param Object opts optional layer option
   */
  addItem(mapData, opts = { contextmenu: true }) {
    const that = this
    const rect = mapData.rect
    const layer = that.L.rectangle(
      [that.p2ll(rect.x, rect.y), that.p2ll(rect.xx, rect.yy)], opts
    )

    // add mapdata to layer
    layer.mapdata = mapData

    layer.addTo(that._map)

    if (that._editOnAdd) {
      layer.enableEdit()
    }

    return layer
  }

  /**
   * remove item
   * @param Object item the map data item
   */
  removeItem(item) {
    if (item && item.remove) {
      item.remove()
      that.onRemoveItem(item)
    }
  }

  /**
   * Handle item removed event
   *
   * @param  Object item  item
   * @return Object   the item
   */
  onRemoveItem(item) {
    return item
  }

  /**
   * render popup
   *
   * @param  Object item the map data item
   * @return String      the render string
   */
  renderPopup(item) {
    return item.$.name
  }
}

export default Limapper
