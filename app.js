//imports
const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');

//const
const logLevel = {
    INFO : "INFO",
    WARN : "WARN",
    ERROR : "ERROR"
}

//config
var global_config = require('./config.json');

//app
app.use(cors());

//load files
loadMocks();

//failover
app.all('*', function(req, res) {
    LOG(logLevel.WARN, "unmatched call : "+req.method+" - "+req.originalUrl);
    // console.log("header : "+JSON.stringify(req.headers));
    // console.log("body : "+JSON.stringify(req.body));
    res.status(501).send();
});

console.log("---");

//start server
setTimeout(startServer, 2000 );







//##############################################
//##############################################
//functions
//##############################################

function startServer(){
    app.listen(global_config.port, function () {
        LOG(logLevel.INFO, "started, listening on "+global_config.port);
        console.log(" ");
    });
}

function loadMocks(){
    LOG(logLevel.INFO, "read mocks in "+global_config.mocks_dir);
    var files = fs.readdirSync(global_config.mocks_dir)
    files.forEach(file => {
      var filePath = global_config.mocks_dir+"/"+file;

      if( fs.lstatSync(filePath).isFile() ){
          LOG(logLevel.INFO, "read file "+filePath);
          var config = require(filePath);
          loadMock(config);
      }
    });
}

function loadMock( mock_config ){
    if( mock_config.enable !== false ){
        LOG(logLevel.INFO, "load mock : '"+mock_config.name+"'");

        for( var j in mock_config.mock ){
            var route = mock_config.mock[j];

            app[route.method.toLowerCase()]("/"+mock_config.baseUrl+'/'+route.url, (function(route){ return function(req, res, next){
                if( route.headers ){
                    for( var key in route.headers ){
                        if( (route.headers[key] != "*" && req.get(key) != route.headers[key]) || (route.headers[key] == "*" && req.get(key) == "") ){
                            next();
                            return;
                        }
                    }
                }

                if( route.pathParams ){
                    for( var key in route.pathParams ){
                        if( (route.pathParams[key] != "*" && req.params[key] != route.pathParams[key]) || (route.pathParams[key] == "*" && req.params[key] == "") ){
                            next();
                            return;
                        }
                    }
                }

                if( route.queryParams ){
                    for( var key in route.queryParams ){
                        if( (route.queryParams[key] != "*" && req.query[key] != route.queryParams[key]) || (route.queryParams[key] == "*" && req.query[key] == "") ){
                            next();
                            return;
                        }
                    }
                }

                LOG(logLevel.INFO, "receive : "+req.method+" - "+req.originalUrl+" | response : "+route.response.code);
                // console.log("params : "+JSON.stringify(req.params));
                // console.log("query : "+JSON.stringify(req.query));
                // console.log("header : "+JSON.stringify(req.headers));
                // console.log("body : "+JSON.stringify(req.body));


                if( route.response.headers ){
                    res.set(route.response.headers);
                }

                var body = route.response.body;
                if( typeof body == 'string' && body.indexOf('file://') == 0 ){
                    var filePath = global_config.mocks_dir+'/'+body.slice(7);
                    LOG(logLevel.INFO, "load response body from '"+filePath+"'");
                    body = require(filePath);
                }

                res.status(route.response.code || 200).send(body);
            };})(route));

            LOG(logLevel.INFO, "    "+padRight(route.method.toUpperCase(), 6)+" - /"+mock_config.baseUrl+'/'+route.url+" | response : "+route.response.code);
        }
    } else {
        LOG(logLevel.INFO, "mock '"+mock_config.name+"' disabled");
    }
}

function padRight(str, length, char){
    char = char || " ";
    for( var i=str.length ; i<=length ; i++){
        str += char;
    }

    return str;
}

function LOG(level, message){
    console.log("["+(new Date().toLocaleString())+"] "+level+" : "+message);
}
