const express = require('express');
const serveStatic = require('serve-static');
const path = require('path');
const cors_anywhere = require('cors-anywhere');
const app = express();
const port = process.env.PORT || 80;
const corsport = process.env.CORSPORT || 8080;

app.set('port', port);

app.use(serveStatic(path.join(__dirname, 'public')))

var server = app.listen(app.get('port'), function () {
    var port = server.address().port;
    console.log('Magic app on port ' + port);
});

cors_anywhere.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ['origin', 'x-requested-with']
}).listen(corsport, function () {
    console.log('Running CORS Anywhere on port ' + corsport);
});