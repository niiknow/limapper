# Leaflet Image Mapper

Image Hotspot Mapper with leaflet and pure javascript.  Vuejs was use to simplify templating and to demonstrate best use of Image Mapper.

## Features

- [x] Render image on leaflet with zoom and pan capability.
- [x] Allow for rectangle image mapping.
- [x] Allow for getting mapped items with pixel coordinates.
- [ ] Enable single item edit mode.

## To run
Reference image mapper js file.

```javascript
var limapper = new Limapper();
limapper.init({ 
    elid: 'map', 
    imageUrl: '319-various-call-center-women-pv.jpg', 
    imageWidth: 958, 
    imageHeight: 737
  });
```

# MIT
