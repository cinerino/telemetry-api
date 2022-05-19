/**
 * ウェブフックルーター(マルチプロジェクト前提)
 */
import * as cinerino from '@cinerino/telemetry-domain';
// import * as EJSON from 'ejson';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NO_CONTENT, OK } from 'http-status';
// import * as moment from 'moment';
import * as mongoose from 'mongoose';
import * as util from 'util';

import authentication from '../middlewares/authentication';
import validator from '../middlewares/validator';

const USE_SAVE_TRANSACTIONS = process.env.USE_SAVE_TRANSACTIONS === '1';

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
            .withMessage(() => 'required')
    ],
    validator,
    async (req, res, next) => {
        try {
            // const transaction = <cinerino.factory.transaction.ITransaction<cinerino.factory.transactionType> | undefined>
            //     EJSON.fromJSONValue(JSON.stringify(req.body.data));
            if (typeof req.body.data === 'string') {
                req.body.data = JSON.parse(req.body.data);
            }
            const transaction = <cinerino.factory.transaction.ITransaction<cinerino.factory.transactionType> | undefined>req.body.data;

            // Mongo trigger対応
            // if (typeof transaction?.startDate === 'object' && transaction.startDate !== undefined && transaction.startDate !== null) {
            //     transaction.startDate = moment((<any>transaction).startDate.$date)
            //         .toDate();
            // }
            // if (typeof transaction?.endDate === 'object' && transaction.endDate !== undefined && transaction.endDate !== null) {
            //     transaction.endDate = moment((<any>transaction).endDate.$date)
            //         .toDate();
            // }
            // if (typeof transaction?.result?.order !== undefined && typeof transaction?.result?.order.price === 'object') {
            //     transaction.result.order.price = Number(transaction.result.order.price.$numberInt);
            // }

            // 注文取引以外は未対応
            if (transaction?.typeOf === cinerino.factory.transactionType.PlaceOrder) {
                if (transaction.status !== cinerino.factory.transactionStatusType.InProgress) {
                    if (USE_SAVE_TRANSACTIONS) {
                        // 取引保管
                        const transactionRepo = new cinerino.repository.Transaction(mongoose.connection);
                        const update: any = { ...transaction };
                        delete update._id;
                        delete update.createdAt;
                        delete update.updatedAt;
                        await transactionRepo.transactionModel.findByIdAndUpdate(
                            String((<any>transaction)._id),
                            { $setOnInsert: update },
                            { upsert: true }
                        )
                            .exec();
                    }
                }

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

    // DB保管
    const notificationRepo = new cinerino.repository.Notification(mongoose.connection);

    let documentId: string | undefined;
    try {
        const doc = await notificationRepo.notificationModel.create(data);
        documentId = doc._id;
    } catch (error) {
        // no op
    }

    try {
        let message = `projectId: ${data?.project?.id}
${util.inspect(data, { depth: 0 })}

https://${req.hostname}/webhooks/notifications/${documentId}
`;

        // 最大 1000文字
        // tslint:disable-next-line:no-magic-numbers
        message = `${message.slice(0, 900)}...`;
        await cinerino.service.notification.report2developers('Message from Cinerino Telemetry', message)();

        res.status(NO_CONTENT)
            .end();
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR)
            .end();
    }
});

/**
 * 汎用的なLINE連携のメッセージ可読表示
 */
webhooksRouter.get(
    '/notifications/:notificationId',
    async (req, res, next) => {
        try {
            let doc: any;

            const notificationRepo = new cinerino.repository.Notification(mongoose.connection);
            doc = await notificationRepo.notificationModel.findById(req.params.notificationId)
                .exec();

            // tslint:disable-next-line:no-magic-numbers
            const docStr = JSON.stringify(doc, null, 2).replace('\n', '<br>');

            res.send(docStr);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 予約のLINE連携
 */
webhooksRouter.post('/lineNotify/reservations', async (req, res) => {
    try {
        let data: any = req.body.data;
        if (typeof data === 'string') {
            data = JSON.parse(req.body.data);
        }

        if (data.typeOf === cinerino.factory.chevre.reservationType.EventReservation) {
            const message = `project.id: ${data?.project?.id}
            ${util.inspect(data?.underName, { depth: 0 })}
            ${util.inspect(data?.reservedTicket?.underName, { depth: 0 })}
            `;

            await cinerino.service.notification.report2developers('Message from Cinerino Telemetry', message)();
        }

        res.status(NO_CONTENT)
            .end();
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR)
            .end();
    }
});

export default webhooksRouter;
