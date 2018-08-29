//imports
const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');
const process = require('process');
const path = require('path');
const url = require('url');
const https = require('https');

const harParser = require('./harParser.js')

//const
const logLevel = {
    DEBUG: { label: "DEBUG", order: 1, colorCode: 'FgDarkGray'},
    INFO: { label: "INFO", order: 2, colorCode: 'FgLighGray'},
    WARN: { label: "WARN", order: 3, colorCode: 'FgYellow'},
    ERROR: { label: "ERROR", order: 4, colorCode: 'FgRed'},
    GLOBAL: { label: "GLOBAL", order: 100, colorCode: 'FgGreen'}
}

const cliColors = {
    Reset : "\x1b[0m",
    Bright : "\x1b[1m",
    Dim : "\x1b[2m",
    Underscore : "\x1b[4m",
    Blink : "\x1b[5m",
    Reverse : "\x1b[7m",
    Hidden : "\x1b[8m",

    FgBlack : "\x1b[30m",
    FgRed : "\x1b[31m",
    FgGreen : "\x1b[32m",
    FgYellow : "\x1b[33m",
    FgBlue : "\x1b[34m",
    FgMagenta : "\x1b[35m",
    FgCyan : "\x1b[36m",
    FgLighGray : "\x1b[37m",
    FgDarkGray : "\x1b[90m",
    FgWhite : "\x1b[97m",

    BgBlack : "\x1b[40m",
    BgRed : "\x1b[41m",
    BgGreen : "\x1b[42m",
    BgYellow : "\x1b[43m",
    BgBlue : "\x1b[44m",
    BgMagenta : "\x1b[45m",
    BgCyan : "\x1b[46m",
    BgWhite : "\x1b[47m"
}

//config
var global_config = require('./config.json');

//app
app.use(cors());

//start server
var server = loadServer();

//reload if config change
fs.watch(global_config.mocks_dir, {recursive:true}, debounce(function(event, file) {
    LOG(logLevel.GLOBAL, "reload server due to ["+event+"], file : "+ JSON.stringify(file));
    console.log(" ");
    if (server && server.close) {
        server.close();
    }

    server = loadServer();
}, 500 ));









//##############################################
//##############################################
//functions
//##############################################

function debounce(callback, time, checkArgs){
    var list = {};

    return function(){
        var args = arguments;
        var argsStr = checkArgs === true ? hash(JSON.stringify(args)) : "0";
        if( !list[argsStr] ){
            list[argsStr] = setTimeout(function(){
                delete list[argsStr];
                callback.apply(null, args);
            });
        }
    }
}

var hash = function(s) {
    /* Simple hash function. */
    var a = 1, c = 0, h, o;
    if (s) {
        a = 0;
        /*jshint plusplus:false bitwise:false*/
        for (h = s.length - 1; h >= 0; h--) {
            o = s.charCodeAt(h);
            a = (a<<6&268435455) + o + (o<<14);
            c = a & 266338304;
            a = c!==0?a^c>>21:a;
        }
    }
    return String(a);
};

function loadServer() {
    //load files
    loadMocks();

    //failover
    app.all('*', failover);

    //start server
    return startServer();
}

function failover(req, res) {
    LOG(logLevel.WARN, "unmatched call : " + req.method + " - " + req.originalUrl);
    // console.log("header : "+JSON.stringify(req.headers));
    // console.log("body : "+JSON.stringify(req.body));
    res.status(501).send();
}

function startServer() {
    return app.listen(global_config.port, function() {
        LOG(logLevel.GLOBAL, "started, listening on " + global_config.port);
    });
}

function loadMocks() {
    LOG(logLevel.DEBUG, "read mocks in " + global_config.mocks_dir);
    var files = fs.readdirSync(global_config.mocks_dir)
    files.forEach(file => {
        if( !/\.json$/.test(file) ){
            return;
        }
        var filePath = global_config.mocks_dir + "/" + file;

        if (fs.lstatSync(filePath).isFile()) {
            LOG(logLevel.DEBUG, "read file " + filePath);
            var config = requireJSON(filePath);
            loadMock(config);
        }
    });
}

function loadMock(mock_config) {
    if (mock_config.enable !== false) {
        LOG(logLevel.INFO, "load mock : '" + mock_config.name + "'");

        if( mock_config.har && !mock_config.mock ){
            mock_config.mock = [];
        }

        var mocks = [].concat(mock_config.mock);

        for( var j in mock_config.har ){
            var har_config = mock_config.har[j];
            var harFilePath = global_config.mocks_dir + "/" + har_config.filePath;
            try{
                var harRoutes = harParser.parse(harFilePath, har_config.options);
            }
            catch(e){
                LOG(logLevel.ERROR, "Error when load HAR file : "+harFilePath);
                LOG(logLevel.ERROR, e);
                continue;
            }

            mocks = mocks.concat(harRoutes);
        }

        for (var j in mocks) {
            var route = mocks[j];

            app[route.method.toLowerCase()]("/" + mock_config.baseUrl + '/' + route.url, (function(route) {
                return function(req, res, next) {
                    if (route.headers) {
                        for (var key in route.headers) {
                            if ((route.headers[key] != "*" && req.get(key) != route.headers[key]) || (route.headers[key] == "*" && req.get(key) == "")) {
                                next();
                                return;
                            }
                        }
                    }

                    if (route.pathParams) {
                        for (var key in route.pathParams) {
                            if ((route.pathParams[key] != "*" && req.params[key] != route.pathParams[key]) || (route.pathParams[key] == "*" && req.params[key] == "")) {
                                next();
                                return;
                            }
                        }
                    }

                    if (route.queryParams) {
                        for (var key in route.queryParams) {
                            if ((route.queryParams[key] != "*" && req.query[key] != route.queryParams[key]) || (route.queryParams[key] == "*" && req.query[key] == "")) {
                                next();
                                return;
                            }
                        }
                    }

                    LOG(logLevel.INFO, "receive : " + req.method + " - " + req.originalUrl + " | response : " + route.response.code);
                    LOG(logLevel.DEBUG,"request headers : "+JSON.stringify(req.headers));
                    LOG(logLevel.DEBUG,"request pathParams : "+JSON.stringify(req.params));
                    LOG(logLevel.DEBUG,"request queryParams : "+JSON.stringify(req.query));
                    LOG(logLevel.DEBUG,"request body : "+JSON.stringify(req.body));


                    if (route.response.headers) {
                        res.set(route.response.headers);
                    }

                    var body = route.response.body;
                    if (typeof body == 'string' && body.indexOf('file://') == 0) {
                        var filePath = global_config.mocks_dir + '/' + body.slice(7);
                        LOG(logLevel.DEBUG, "response code : "+route.response.code+", response body from '" + filePath + "'");

                        res.status(route.response.code || 200).sendFile(path.resolve(filePath));
                    }
                    else {
                        LOG(logLevel.DEBUG, "response code : "+route.response.code+", response body '" + JSON.stringify(body) + "'");
                        res.status(route.response.code || 200).send(body);
                    }
                };
            })(route));

            var queryParams = [];
            if( route.queryParams ){
                for( var key in route.queryParams ){
                    queryParams.push(key+"="+route.queryParams[key]);
                }
            }
            var queryParamsString = queryParams.length ? "?"+queryParams.join("&") : ""

            LOG(logLevel.INFO, "    " + padRight(route.method.toUpperCase(), 6) + " - /" + mock_config.baseUrl + '/' + route.url + queryParamsString +" | response : " + route.response.code);
        }
    } else {
        LOG(logLevel.DEBUG, "mock '" + mock_config.name + "' disabled");
    }
}

function padRight(str, length, char) {
    char = char || " ";
    for (var i = str.length; i <= length; i++) {
        str += char;
    }

    return str;
}

function LOG(level, message) {
    if( level.order < logLevel[global_config.log_level].order){
        return;
    }

    var color = cliColors[level.colorCode] || cliColors.Reset;

    console.log(color+"[" + (new Date().toLocaleString()) + "] " + level.label + " : " + message + cliColors.Reset);
}

function requireJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
