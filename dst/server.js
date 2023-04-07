"use strict";
/**
 * Module dependencies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const startTime = process.hrtime();
const createDebug = require("debug");
const http = require("http");
const app = require("./app/app");
const debug = createDebug('cinerino-telemetry-api:server');
/**
 * Get port from environment and store in Express.
 */
const port = normalizePort((process.env.PORT === undefined) ? '8080' : process.env.PORT);
app.set('port', port);
/**
 * Create HTTP server.
 */
const server = http.createServer(app);
/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
// Server has a 5 seconds keep-alive timeout by default
// tslint:disable-next-line:no-magic-numbers
server.keepAliveTimeout = (typeof process.env.NODE_KEEP_ALIVE_TIMEOUT === 'string') ? Number(process.env.NODE_KEEP_ALIVE_TIMEOUT) : 10000;
/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    // tslint:disable-next-line:no-magic-numbers
    const portNumber = parseInt(val, 10);
    if (isNaN(portNumber)) {
        // named pipe
        return val;
    }
    if (portNumber >= 0) {
        // port number
        return portNumber;
    }
    return false;
}
/**
 * Event listener for HTTP server 'error' event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string'
        ? `Pipe ${port}`
        : `Port ${port.toString()}`;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
        default:
            throw error;
    }
}
/**
 * Event listener for HTTP server 'listening' event.
 */
function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? `pipe ${addr}`
        : `port ${addr === null || addr === void 0 ? void 0 : addr.port.toString()}`;
    debug(`Listening on ${bind}`);
    const diff = process.hrtime(startTime);
    debug(`api server listening took ${diff[0]} seconds and ${diff[1]} nanoseconds.`);
}
