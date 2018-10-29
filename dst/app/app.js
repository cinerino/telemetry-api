"use strict";
/**
 * Expressアプリケーション
 */
const cinerino = require("@cinerino/telemetry-domain");
const middlewares = require("@motionpicture/express-middleware");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const expressValidator = require("express-validator");
const helmet = require("helmet");
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
app.use(middlewares.basicAuth({
    name: process.env.BASIC_AUTH_NAME,
    pass: process.env.BASIC_AUTH_PASS,
    unauthorizedHandler: (__, res, next) => {
        res.setHeader('WWW-Authenticate', 'Basic realm="cinerino-telemetry-api Authentication"');
        next(new cinerino.factory.errors.Unauthorized());
    }
}));
const options = {
    origin: '*',
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'X-Access-Token', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
    credentials: false,
    methods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'POST', 'DELETE'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use(cors(options));
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ['\'self\'']
        // styleSrc: ['\'unsafe-inline\'']
    }
}));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
const SIXTY_DAYS_IN_SECONDS = 5184000;
app.use(helmet.hsts({
    maxAge: SIXTY_DAYS_IN_SECONDS,
    includeSubdomains: false
}));
// api version
// tslint:disable-next-line:no-require-imports no-var-requires
const packageInfo = require('../../package.json');
app.use((__, res, next) => {
    res.setHeader('X-API-Version', packageInfo.version);
    next();
});
// view engine setup
// app.set('views', `${__dirname}/views`);
// app.set('view engine', 'ejs');
app.use(bodyParser.json({ limit: '50mb' }));
// The extended option allows to choose between parsing the URL-encoded data
// with the querystring library (when false) or the qs library (when true).
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(expressValidator({})); // this line must be immediately after any of the bodyParser middlewares!
// 静的ファイル
// app.use(express.static(__dirname + '/../../public'));
connectMongo_1.connectMongo({ defaultConnection: true }).then().catch((err) => {
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
