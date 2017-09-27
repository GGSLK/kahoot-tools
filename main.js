var express = require('express');
var path = require('path');
var unirest = require('unirest');
var request = require('request');

var httpServer = express();
var httpPort = process.env.PORT || 8080;

httpServer.set('port', httpPort);

httpServer.use(express.static(path.join(__dirname, 'public')));

var server = httpServer.listen(httpServer.get('port'), function () {
    var port = server.address().port;
    console.log('Magic httpServer on port ' + port);
});

httpServer.use('/', function (req, res) {
    var url = req.url;
    while (url.charAt(0) === '/') {
        url = url.substr(1);
    }
    if (url.indexOf('kahoot.it') !== -1) {
        unirest.get(url)
            .end(function (response) {
                if (!response.err) {
                    var headers = response.headers || [];
                    headers['Access-Control-Allow-Origin'] = '*';
                    headers['Access-Control-Allow-Headers'] = 'X-Requested-With';
                    headers['Access-Control-Expose-Headers'] = 'x-kahoot-session-token';
                    res.status(headers).write(JSON.stringify(response.body));
                    res.end(res.status);
                } else {
                    res.write(JSON.stringify(response.error));
                    res.end();
                }
            });

    } else {
        res.end();
    }
});