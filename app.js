const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');

app.use(cors());

var global_config = require('./config.json');

console.log("["+(new Date().toLocaleString())+"] INFO : read mocks in "+global_config.mocks_dir);
var files = fs.readdirSync(global_config.mocks_dir)
files.forEach(file => {
  var filePath = global_config.mocks_dir+"/"+file;

  if( fs.lstatSync(filePath).isFile() ){
      console.log("["+(new Date().toLocaleString())+"] INFO : read file "+filePath);
      var config = require(filePath);
      loadMock(config);
  }
});
console.log("---");

// loadMock(config);

app.all('*', function(req, res) {
    console.warn("["+(new Date().toLocaleString())+"] WARN : unmatched call : "+req.method+" - "+req.originalUrl);
    // console.log("header : "+JSON.stringify(req.headers));
    // console.log("body : "+JSON.stringify(req.body));
    res.status(501).send();
});

setTimeout(function(){
        app.listen(global_config.port, function () {
        console.log("["+(new Date().toLocaleString())+"] INFO : started, listening on "+global_config.port);
        console.log(" ");
    })
}, 2000 );


function loadMock( mock_config ){
    if( mock_config.enable !== false ){
        console.log("["+(new Date().toLocaleString())+"] INFO : load mock : '"+mock_config.name+"'");

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

                console.log("["+(new Date().toLocaleString())+"] INFO : receive : "+req.method+" - "+req.originalUrl+" | response : "+route.response.code);
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
                    console.log("["+(new Date().toLocaleString())+"] INFO : load response body from '"+filePath+"'");
                    body = require(filePath);
                }

                res.status(route.response.code || 200).send(body);
            };})(route));

            console.log("    "+route.method.toUpperCase()+" - /"+mock_config.baseUrl+'/'+route.url+" | response : "+route.response.code)
        }
    } else {
        console.log("["+(new Date().toLocaleString())+"] INFO : mock '"+mock_config.name+"' disabled");
    }
}
