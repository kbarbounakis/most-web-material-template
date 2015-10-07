/**
 * MOST Web Framework application server initialization
 */
var web = require('most-web');

var options = {
        port: process.env.PORT ? process.env.PORT: 3000,
        ip:process.env.IP || '0.0.0.0'
    };
var server = web.current.start(options);