/**
 * プロジェクトルーター
 */
import * as cinerino from '@cinerino/telemetry-domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { CREATED, INTERNAL_SERVER_ERROR, NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';
import * as util from 'util';

import authentication from '../../middlewares/authentication';
import validator from '../../middlewares/validator';

const projectRouter = Router();
projectRouter.use(authentication);

/**
 * タスク追加
 */
projectRouter.post(
    '/:projectId/tasks/:name',
    // permitScopes(['admin']),
    ...[
        body('data')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const taskRepo = new cinerino.repository.Task(mongoose.connection);
            const attributes: cinerino.factory.task.IAttributes<cinerino.factory.taskName> = {
                name: req.params.name,
                project: { typeOf: cinerino.factory.organizationType.Project, id: req.params.projectId },
                status: cinerino.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
                numberOfTried: 0,
                executionResults: [],
                data: req.body.data
            };
            const task = await taskRepo.save(attributes);
            res.status(CREATED)
                .json(task);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * テレメトリー検索
 */
projectRouter.get(
    '/:projectId/telemetry/:telemetryType',
    // permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const telemetryRepo = new cinerino.repository.Telemetry(mongoose.connection);
            const datas = await cinerino.service.telemetry.search({
                projectId: req.params.projectId,
                telemetryType: req.params.telemetryType,
                measureFrom: moment(req.query.measureFrom)
                    .toDate(),
                measureThrough: moment(req.query.measureThrough)
                    .toDate(),
                scope: cinerino.service.telemetry.TelemetryScope.Global
            })({ telemetry: telemetryRepo });
            res.json(datas);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 受信OK
 */
const RECV_RES_OK = '0';
/**
 * 受信失敗
 */
const RECV_RES_NG = '1';

projectRouter.post('/:projectId/gmo/notify', async (req, res) => {
    if (req.body.OrderID === undefined) {
        res.send(RECV_RES_OK);

        return;
    }

    // リクエストボディから通知保管
    try {
        // const notification = GMO.factory.resultNotification.creditCard.createFromRequestBody(req.body);
        // await taskRepo.save(attributes);
        res.send(RECV_RES_OK);
    } catch (error) {
        res.send(RECV_RES_NG);
    }
});

/**
 * 汎用的なLINE連携
 */
projectRouter.post('/:projectId/lineNotify', async (req, res) => {
    const data = req.body.data;

    try {
        const message = `Project: ${req.params.projectId}
${util.inspect(data, { depth: 0 })}
`;

        await cinerino.service.notification.report2developers('Message from Cinerino Telemetry', message)();

        res.status(NO_CONTENT)
            .end();
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR)
            .end();
    }
});

export default projectRouter;
