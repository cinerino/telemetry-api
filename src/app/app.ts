/**
 * Expressアプリケーション
 */
import * as bodyParser from 'body-parser';
import * as express from 'express';
import helmet from 'helmet';
import * as qs from 'qs';

import { connectMongo } from '../connectMongo';

import errorHandler from './middlewares/errorHandler';
import notFoundHandler from './middlewares/notFoundHandler';
import router from './routes/router';

const app = express();
app.set('query parser', (str: any) => qs.parse(str, {
    arrayLimit: 1000,
    parseArrays: true,
    allowDots: false,
    allowPrototypes: true
}));

app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ['\'self\'']
        }
    },
    hsts: {
        maxAge: 5184000, // SIXTY_DAYS_IN_SECONDS
        includeSubDomains: false
    },
    referrerPolicy: { policy: 'no-referrer' }
}));

// api version
// tslint:disable-next-line:no-require-imports no-var-requires
const packageInfo = require('../../package.json');
app.use((__, res, next) => {
    res.setHeader('X-API-Version', <string>packageInfo.version);
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

connectMongo({ defaultConnection: true })
    .then()
    .catch((err) => {
        // tslint:disable-next-line:no-console
        console.error('connetMongo:', err);
        process.exit(1);
    });

// routers
app.use('/', router);

// 404
app.use(notFoundHandler);

// error handlers
app.use(errorHandler);

export = app;
