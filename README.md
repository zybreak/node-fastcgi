FastCGI implemented in node.js
===

Hello World

    var fastcgi = require('fastcgi');

    fastcgi.createServer(function(req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n');
    }).listen(9000, '127.0.0.1');
