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
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const validator_1 = require("../middlewares/validator");
const webhooksRouter = express_1.Router();
webhooksRouter.use(authentication_1.default);
/**
 * 取引ウェブフック受信
 */
webhooksRouter.post('/onPlaceOrderEnded', ...[
    check_1.body('data')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    check_1.body('data.project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const taskRepo = new cinerino.repository.Task(mongoose.connection);
        const attributes = {
            name: 'analyzePlaceOrder',
            project: { typeOf: cinerino.factory.organizationType.Project, id: (_b = (_a = req.body.data) === null || _a === void 0 ? void 0 : _a.project) === null || _b === void 0 ? void 0 : _b.id },
            status: cinerino.factory.taskStatus.Ready,
            runsAt: new Date(),
            remainingNumberOfTries: 3,
            numberOfTried: 0,
            executionResults: [],
            data: req.body.data
        };
        yield taskRepo.save(attributes);
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
                    project: { typeOf: cinerino.factory.organizationType.Project, id: projectId },
                    status: cinerino.factory.taskStatus.Ready,
                    runsAt: new Date(),
                    remainingNumberOfTries: 3,
                    numberOfTried: 0,
                    executionResults: [],
                    data: {
                        event: event,
                        project: { typeOf: cinerino.factory.organizationType.Project, id: projectId }
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
exports.default = webhooksRouter;
