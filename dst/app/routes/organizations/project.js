"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * プロジェクトルーター
 */
const cinerino = require("@cinerino/telemetry-domain");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const moment = require("moment");
const authentication_1 = require("../../middlewares/authentication");
const validator_1 = require("../../middlewares/validator");
const projectRouter = express_1.Router();
projectRouter.use(authentication_1.default);
/**
 * タスク追加
 */
projectRouter.post('/:projectId/tasks/:name', 
// permitScopes(['admin']),
...[
    check_1.body('data').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const taskRepo = new cinerino.repository.Task(cinerino.mongoose.connection);
        const attributes = {
            name: req.params.name,
            status: cinerino.factory.taskStatus.Ready,
            runsAt: new Date(),
            remainingNumberOfTries: 3,
            lastTriedAt: null,
            numberOfTried: 0,
            executionResults: [],
            data: Object.assign({}, req.body.data, { projectId: req.params.projectId })
        };
        const task = yield taskRepo.save(attributes);
        res.status(http_status_1.CREATED).json(task);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * テレメトリー検索
 */
projectRouter.get('/:projectId/telemetry/:telemetryType', 
// permitScopes(['admin']),
validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const telemetryRepo = new cinerino.repository.Telemetry(cinerino.mongoose.connection);
        const datas = yield cinerino.service.telemetry.search({
            telemetryType: req.params.telemetryType,
            measureFrom: moment(req.query.measureFrom).toDate(),
            measureThrough: moment(req.query.measureThrough).toDate(),
            scope: cinerino.service.telemetry.TelemetryScope.Global
        })({ telemetry: telemetryRepo });
        res.json(datas);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = projectRouter;
