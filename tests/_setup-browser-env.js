import browserEnv from 'browser-env'
browserEnv(['window', 'document', 'navigator'])

const leaflet = require('leaflet');
window.L = global.L = leaflet;
