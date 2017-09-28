const express = require('express');
const path = require('path');
const cors_proxy = require('cors-anywhere');
const corsPort = process.env.PORT || 8080;
const httpServer = express();
const httpPort = process.env.PORT || 3000;

httpServer.set('port', httpPort);

httpServer.use(express.static(path.join(__dirname, 'public')));

var server = httpServer.listen(httpServer.get('port'), function () {
    var port = server.address().port;
    console.log('Magic httpServer on port ' + port);
});

cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ['origin', 'x-requested-with']
}).listen(corsPort, function () {
    console.log('Running CORS Anywhere on port ' + corsPort);
});