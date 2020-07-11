/**
 * ヘルスチェックルーター
 */
import * as express from 'express';
import { OK } from 'http-status';
import * as mongoose from 'mongoose';

const healthRouter = express.Router();
healthRouter.get(
    '',
    async (_, res, next) => {
        try {
            await mongoose.connection.db.admin().ping();
            res.status(OK).send('healthy!');
        } catch (error) {
            next(error);
        }
    }
);
export default healthRouter;
