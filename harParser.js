const fs = require('fs');

var ignoredHeader = [
    "Date","X-Powered-By","Content-Length","Connection"
];

function parse(filePath, options){
    options = options || {};

    var har = requireJSON(filePath);

    var mocks = [];

    for( var i in har.log.entries ){
        var entry = har.log.entries[i];
        var mock = {
            response : {
                headers : {}
            },
            queryParams : {}
        };

        if( !inFilter(entry.request.url, options.filter) ){
            continue;
        }

        mock.method = entry.request.method;
        var urlParts = entry.request.url.replace(/https?:\/\/.+?\//g,"").split("?");
        mock.url = urlParts[0];

        if( urlParts[1] ){
            var queryParams = urlParts[1].split("&");
            for( var j in queryParams ){
                var queryParam = queryParams[j].split("=");
                var key = queryParam[0];
                var value = queryParam[1];

                if( options.queryParams && options.queryParams.ignore && !!~options.queryParams.ignore.indexOf(key) ){
                    continue;
                }

                mock.queryParams[key] = value;
            }
        }

        mock.response.code = entry.response.status;
        for( var j in entry.response.headers ){
            var header = entry.response.headers[j];
            if( ~ignoredHeader.indexOf(header.name) ){
                continue;
            }
            mock.response.headers[header.name] = header.value;
        }
        mock.response.body = entry.response.content.text;



        mocks.push(mock);
    }

    return mocks;
}

function inFilter(value, filter){
    if( filter ){
        if( Array.isArray(filter) ){
            for( var i in filter ){
                var filterValue = filter[i];
                var reg = new RegExp(filterValue);
                if( reg.test(value)){
                    return true;
                }
            }
        }
        else{
            var reg = new RegExp(filter);
            if(reg.test(value)){
                return true;
            }
        }

        return false;
    }

    return true;
}

function requireJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

module.exports = { parse : parse };
