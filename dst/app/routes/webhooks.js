"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ウェブフックルーター(マルチプロジェクト前提)
 */
const cinerino = require("@cinerino/telemetry-domain");
// import * as EJSON from 'ejson';
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
// import * as moment from 'moment';
const mongoose = require("mongoose");
const util = require("util");
const authentication_1 = require("../middlewares/authentication");
const validator_1 = require("../middlewares/validator");
const USE_SAVE_TRANSACTIONS = process.env.USE_SAVE_TRANSACTIONS === '1';
const webhooksRouter = (0, express_1.Router)();
webhooksRouter.use(authentication_1.default);
/**
 * 取引ウェブフック受信
 */
webhooksRouter.post('/onPlaceOrderEnded', ...[
    (0, check_1.body)('data')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const transaction = <cinerino.factory.transaction.ITransaction<cinerino.factory.transactionType> | undefined>
        //     EJSON.fromJSONValue(JSON.stringify(req.body.data));
        if (typeof req.body.data === 'string') {
            req.body.data = JSON.parse(req.body.data);
        }
        const transaction = req.body.data;
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
        if ((transaction === null || transaction === void 0 ? void 0 : transaction.typeOf) === cinerino.factory.transactionType.PlaceOrder) {
            if (transaction.status !== cinerino.factory.transactionStatusType.InProgress) {
                if (USE_SAVE_TRANSACTIONS) {
                    // 取引保管
                    const transactionRepo = new cinerino.repository.Transaction(mongoose.connection);
                    const update = Object.assign({}, transaction);
                    delete update._id;
                    delete update.createdAt;
                    delete update.updatedAt;
                    yield transactionRepo.transactionModel.findByIdAndUpdate(String(transaction._id), { $setOnInsert: update }, { upsert: true })
                        .exec();
                }
            }
            // 同期的に分析処理
            yield cinerino.service.telemetry.analyzePlaceOrder(transaction)({
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
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
webhooksRouter.post('/sendGrid/event/notify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const events = req.body;
    if (!Array.isArray(events)) {
        res.status(http_status_1.BAD_REQUEST)
            .end();
        return;
    }
    // リクエストボディから分析タスク生成
    try {
        const taskRepo = new cinerino.repository.Task(mongoose.connection);
        yield Promise.all(events.map((event) => __awaiter(void 0, void 0, void 0, function* () {
            // SendGridへのユニーク引数でプロジェクトが指定されているはず
            const projectId = event.projectId;
            if (typeof projectId === 'string') {
                const attributes = {
                    name: 'analyzeSendGridEvent',
                    project: { typeOf: cinerino.factory.chevre.organizationType.Project, id: projectId },
                    status: cinerino.factory.taskStatus.Ready,
                    runsAt: new Date(),
                    remainingNumberOfTries: 3,
                    numberOfTried: 0,
                    executionResults: [],
                    data: {
                        event: event,
                        project: { typeOf: cinerino.factory.chevre.organizationType.Project, id: projectId }
                    }
                };
                yield taskRepo.save(attributes);
            }
        })));
        res.status(http_status_1.OK)
            .end();
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .end();
    }
}));
/**
 * 汎用的なLINE連携
 */
webhooksRouter.post('/lineNotify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = req.body.data;
    // DB保管
    const notificationRepo = new cinerino.repository.Notification(mongoose.connection);
    let documentId;
    try {
        const doc = yield notificationRepo.notificationModel.create(data);
        documentId = doc._id;
    }
    catch (error) {
        // no op
    }
    try {
        let message = `projectId: ${(_a = data === null || data === void 0 ? void 0 : data.project) === null || _a === void 0 ? void 0 : _a.id}
${util.inspect(data, { depth: 0 })}

https://${req.hostname}/webhooks/notifications/${documentId}
`;
        // 最大 1000文字
        // tslint:disable-next-line:no-magic-numbers
        message = `${message.slice(0, 900)}...`;
        yield cinerino.service.notification.report2developers('Message from Cinerino Telemetry', message)();
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        res.status(http_status_1.INTERNAL_SERVER_ERROR)
            .end();
    }
}));
/**
 * 汎用的なLINE連携のメッセージ可読表示
 */
webhooksRouter.get('/notifications/:notificationId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let doc;
        const notificationRepo = new cinerino.repository.Notification(mongoose.connection);
        doc = yield notificationRepo.notificationModel.findById(req.params.notificationId)
            .exec();
        res.render('webhooks/notifications/show', { doc });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 予約のLINE連携
 */
// webhooksRouter.post('/lineNotify/reservations', async (req, res) => {
//     try {
//         let data: any = req.body.data;
//         if (typeof data === 'string') {
//             data = JSON.parse(req.body.data);
//         }
//         if (data.typeOf === cinerino.factory.chevre.reservationType.EventReservation) {
//             const message = `project.id: ${data?.project?.id}
//             ${util.inspect(data?.underName, { depth: 0 })}
//             ${util.inspect(data?.reservedTicket?.underName, { depth: 0 })}
//             `;
//             await cinerino.service.notification.report2developers('Message from Cinerino Telemetry', message)();
//         }
//         res.status(NO_CONTENT)
//             .end();
//     } catch (error) {
//         res.status(INTERNAL_SERVER_ERROR)
//             .end();
//     }
// });
exports.default = webhooksRouter;
