"use strict";
const methodOverride = require("method-override");
const multipart = require("connect-multiparty");
const eventemitter2_1 = require("eventemitter2");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const bodyParser = require("body-parser");
const express = require("express");
const helmet = require("helmet");
const ws = require("ws");
class Server extends eventemitter2_1.EventEmitter2 {
    constructor(options) {
        super();
        // In case of no options
        !options && (options = {});
        // Load default configuration
        this.config = require('./defaultServerConfig.js');
        // Set initial status
        this.status = -1;
        // Overwrite defaults
        for (let option in options)
            this.config[option] = options[option];
        // Create the express app
        this.server = express();
        // Use compression on all requests
        // @todo toggle compression with optional parameter
        this.server.use(compression({ threshold: 0, filter: () => true }));
        // Create router
        this.router = express.Router();
        // Set upload limit
        this.server.use(bodyParser.raw({
            limit: this.config.uploadLimit
        }));
        // Block libwww-perl
        this.server.use((req, res, next) => /libwww-perl/.test(req.get('user-agent')) ? res.status(403).end() : next());
        // Parse json api requests
        this.server.use(bodyParser.urlencoded({ extended: true }));
        this.server.use(bodyParser.json());
        // Add headers
        this.server.use((req, res, next) => {
            res.setHeader('Connection', 'Keep-Alive');
            res.setHeader('Keep-Alive', 'timeout=15, max=100');
            return next();
        });
        // Standard middleware
        this.server.use(helmet.xssFilter());
        this.server.use(cookieParser());
        this.server.use(multipart());
        this.server.use(methodOverride());
        // Disable x-powered-by header
        this.server.disable('x-powered-by');
        // A route to be used later
        this.server.use(this.router);
        // If a static content path was provided
        if (this.config.static) {
            // Always add cache control header
            this.server.use(function (req, res, next) {
                res.setHeader("Cache-Control", "max-age=31104000, public");
                res.setHeader('Expires', new Date(Date.now() + 345600000).toUTCString());
                return next();
            });
            // Serve static content
            this.server.use(express.static(this.config.static));
        }
        // Not found
        this.server.get('*', function (req, res) {
            res.writeHead(404, 'Not found');
            res.end('404: Not found');
        });
        var config = this.config;
        // Start server as specified in config
        if (config.ssl) {
            this.httpServer = require('https').createServer({
                key: config.sslCert.key,
                cert: config.sslCert.cert,
                ca: config.sslCert.ca,
                passphrase: config.passphrase
            }, this.server);
        }
        else
            this.httpServer = require('http').createServer(this.server);
        // Start and bind a WebSocket server if
        // specified in config
        if (config.ws) {
            // @todo check headers
            // var headers: any = {};
            // if (config.serverHeader)
            // headers.server = 'ZenX/' +
            // packageInfo.version;
            // Start and bind websocket server
            this.ws = new ws.Server({
                server: this.httpServer
            });
            this.ws.on('error', err => console.log('WebSocket server error: ', err));
        }
        // Callback
        this.httpServer.listen(config.port, config.bind, () => this.emit('listening'));
        this.httpServer.on('listening', () => this.emit('listening'));
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Server;
;
