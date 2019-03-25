const path = require('path');
const mockServer = require('./app.js');

var config = require(path.join(__dirname, 'config.json'));

mockServer(config);