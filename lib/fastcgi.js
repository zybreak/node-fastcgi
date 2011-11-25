// Copyright Lee Harvey Oswald
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util');
var net = require('net');
var Parser = require('parser').Parser;
var IncomingMessage = require('http').IncomingMessage;
var ServerResponse = require('http').ServerResponse;

var debug;
if (process.env.NODE_DEBUG && /fastcgi/.test(process.env.NODE_DEBUG)) {
    debug = function(x) { console.error('FASTCGI: %s', x); };
} else {
    debug = function() { };
}

function connectionListener(socket) {
    var self = this;

    var incoming = [];
    var outgoing = [];

    debug('SERVER new fastcgi connection');

    socket.setTimeout(2 * 60 * 1000);

    var parser = new Parser(socket);

    parser.onError = function(error) {
        console.log('error');
        console.log(error);
    };

    parser.onIncoming = function(req, keepAlive) {
        var res = new ServerResponse(req);
        res.shouldKeepAlive = keepAlive;
        var socket = parser._socket;
        res.assignSocket(socket);
        res.on('finish', function () {
            res.detachSocket(socket);
            socket.destroySoon();
        });

        self.emit('request', req, res);
    }

    socket.ondata = function(d, start, end) {
        debug('SERVER ondata');
        var ret = parser.execute(d, start, end - start);
        if (ret instanceof Error) {
            debug('SERVER parse error');
            socket.destroy(ret);
        }
    };

    socket.onend = function() {
        debug('SERVER onend');
        socket.destroy();
    }

    socket.addListener('timeout', function() {
        socket.destroy();
    });

    socket.addListener('error', function(e) {
        this.emit('clientError', e);
    });

    socket.addListener('close', function() {
        debug('SERVER close');
    });
}

function Server(requestListener) {
    if (!(this instanceof Server)) {
        return new Server(requestListener);
    }

    if (requestListener) {
        this.addListener('request', requestListener);
    }

    this.addListener('connection', connectionListener);
}

util.inherits(Server, net.Server);

exports.Server = Server;

exports.createServer = function(requestListener) {
    return new Server(requestListener);
}

