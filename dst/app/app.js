"use strict";
/**
 * Expressアプリケーション
 */
const bodyParser = require("body-parser");
const express = require("express");
const helmet_1 = require("helmet");
const qs = require("qs");
const connectMongo_1 = require("../connectMongo");
const errorHandler_1 = require("./middlewares/errorHandler");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
const router_1 = require("./routes/router");
const app = express();
app.set('query parser', (str) => qs.parse(str, {
    arrayLimit: 1000,
    parseArrays: true,
    allowDots: false,
    allowPrototypes: true
}));
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ['\'self\'']
        }
    },
    hsts: {
        maxAge: 5184000,
        includeSubDomains: false
    },
    referrerPolicy: { policy: 'no-referrer' }
}));
// api version
// tslint:disable-next-line:no-require-imports no-var-requires
const packageInfo = require('../../package.json');
app.use((__, res, next) => {
    res.setHeader('X-API-Version', packageInfo.version);
    next();
});
// view engine setup
app.set('views', `${__dirname}/../../views`);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ limit: '50mb' }));
// The extended option allows to choose between parsing the URL-encoded data
// with the querystring library (when false) or the qs library (when true).
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
// 静的ファイル
// app.use(express.static(__dirname + '/../../public'));
(0, connectMongo_1.connectMongo)({ defaultConnection: true })
    .then()
    .catch((err) => {
    // tslint:disable-next-line:no-console
    console.error('connetMongo:', err);
    process.exit(1);
});
// routers
app.use('/', router_1.default);
// 404
app.use(notFoundHandler_1.default);
// error handlers
app.use(errorHandler_1.default);
module.exports = app;
