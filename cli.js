#!/usr/bin/env node

const path = require('path');
const process = require('process');
const fs = require('fs');
const mockServer = require('./app.js');

const [, , ...args] = process.argv

var appDir = path.resolve();
var userConfigPath = path.join(appDir, 'mocks.json');

var moduleDir = __dirname;

var config = require(path.join(moduleDir, 'config.json'));

if (fs.existsSync(userConfigPath)) {
    const userConfig = require(userConfigPath);
    Object.assign(config, userConfig);
}

mockServer(config);