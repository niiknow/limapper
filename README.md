# Leaflet Image Mapper

Image Hotspot Mapper with leaflet and pure javascript.  BootstrapCss and Vuejs use in demo simplify template and styling.

You can use tools like Vuejs to render imagemap to the UI and/or [ImageMapster](https://github.com/jamietre/ImageMapster) to provide user friendly interaction.

## Features

- [x] Render image on leaflet with zoom and pan capability.
- [x] Allow for rectangle image mapping.
- [x] Allow for getting mapped items with pixel coordinates.
- [x] Enable item lock.

## To run
Reference image mapper js file.

```javascript
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css'
const limapper = new Limapper();
limapper.init({ 
    elid: 'map', 
    imageUrl: '319-various-call-center-women-pv.jpg', 
    imageWidth: 958, 
    imageHeight: 737
  });
```

debug locally with:
```
npm run dev
```

build with:
```
npm run build
```

# MIT
