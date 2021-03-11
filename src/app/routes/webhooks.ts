/**
 * ウェブフックルーター(マルチプロジェクト前提)
 */
import * as cinerino from '@cinerino/telemetry-domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NO_CONTENT, OK } from 'http-status';
import * as mongoose from 'mongoose';
import * as util from 'util';

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
            const transaction = <cinerino.factory.transaction.ITransaction<cinerino.factory.transactionType>>req.body.data;
            // 注文取引以外は未対応
            if (transaction.typeOf === cinerino.factory.transactionType.PlaceOrder) {
                // 同期的に分析処理
                await cinerino.service.telemetry.analyzePlaceOrder(transaction)({
                    telemetry: new cinerino.repository.Telemetry(mongoose.connection)
                });

            }

            // const taskRepo = new cinerino.repository.Task(mongoose.connection);
            // const attributes: cinerino.factory.task.IAttributes<cinerino.factory.taskName> = {
            //     name: <any>'analyzePlaceOrder',
            //     project: { typeOf: cinerino.factory.organizationType.Project, id: req.body.data?.project?.id },
            //     status: cinerino.factory.taskStatus.Ready,
            //     runsAt: new Date(),
            //     remainingNumberOfTries: 3,
            //     numberOfTried: 0,
            //     executionResults: [],
            //     data: req.body.data
            // };
            // await taskRepo.save(attributes);

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

webhooksRouter.post(
    '/sendGrid/event/notify',
    async (req, res) => {
        const events = req.body;

        if (!Array.isArray(events)) {
            res.status(BAD_REQUEST)
                .end();

            return;
        }

        // リクエストボディから分析タスク生成
        try {
            const taskRepo = new cinerino.repository.Task(mongoose.connection);

            await Promise.all(events.map(async (event) => {
                // SendGridへのユニーク引数でプロジェクトが指定されているはず
                const projectId = event.projectId;
                if (typeof projectId === 'string') {
                    const attributes: cinerino.factory.task.IAttributes<cinerino.factory.taskName> = {
                        name: <any>'analyzeSendGridEvent',
                        project: { typeOf: cinerino.factory.chevre.organizationType.Project, id: projectId },
                        status: cinerino.factory.taskStatus.Ready,
                        runsAt: new Date(),
                        remainingNumberOfTries: 3,
                        numberOfTried: 0,
                        executionResults: [],
                        data: <any>{
                            event: event,
                            project: { typeOf: cinerino.factory.chevre.organizationType.Project, id: projectId }
                        }
                    };

                    await taskRepo.save(attributes);
                }
            }));

            res.status(OK)
                .end();
        } catch (error) {
            res.status(INTERNAL_SERVER_ERROR)
                .end();
        }
    }
);

/**
 * 汎用的なLINE連携
 */
webhooksRouter.post('/lineNotify', async (req, res) => {
    const data = req.body.data;

    try {
        const message = `project.id: ${data?.project?.id}
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

export default webhooksRouter;
