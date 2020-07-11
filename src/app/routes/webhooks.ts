/**
 * ウェブフックルーター(マルチプロジェクト前提)
 */
import * as cinerino from '@cinerino/telemetry-domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import validator from '../middlewares/validator';

const webhooksRouter = Router();
webhooksRouter.use(authentication);

/**
 * 取引ウェブフック受信
 */
webhooksRouter.post(
    '/onPlaceOrderEnded',
    ...[
        body('data')
            .not()
            .isEmpty()
            .withMessage(() => 'required'),
        body('data.project.id')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isString()
    ],
    validator,
    async (req, res, next) => {
        try {
            const taskRepo = new cinerino.repository.Task(mongoose.connection);
            const attributes: cinerino.factory.task.IAttributes<cinerino.factory.taskName> = {
                name: <any>'analyzePlaceOrder',
                project: { typeOf: cinerino.factory.organizationType.Project, id: req.body.data?.project?.id },
                status: cinerino.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
                numberOfTried: 0,
                executionResults: [],
                data: req.body.data
            };
            await taskRepo.save(attributes);

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default webhooksRouter;
