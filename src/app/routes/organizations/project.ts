/**
 * プロジェクトルーター
 */
import * as cinerino from '@cinerino/telemetry-domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { CREATED } from 'http-status';
import * as moment from 'moment';

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
        body('data').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
    ],
    validator,
    async (req, res, next) => {
        try {
            const taskRepo = new cinerino.repository.Task(cinerino.mongoose.connection);
            const attributes: cinerino.factory.task.IAttributes<cinerino.factory.taskName> = {
                name: req.params.name,
                status: cinerino.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
                lastTriedAt: null,
                numberOfTried: 0,
                executionResults: [],
                data: {
                    ...req.body.data,
                    projectId: req.params.projectId
                }
            };
            const task = await taskRepo.save(attributes);
            res.status(CREATED).json(task);
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
            const telemetryRepo = new cinerino.repository.Telemetry(cinerino.mongoose.connection);
            const datas = await cinerino.service.telemetry.search({
                telemetryType: req.params.telemetryType,
                measureFrom: moment(req.query.measureFrom).toDate(),
                measureThrough: moment(req.query.measureThrough).toDate(),
                scope: cinerino.service.telemetry.TelemetryScope.Global
            })({ telemetry: telemetryRepo });
            res.json(datas);
        } catch (error) {
            next(error);
        }
    }
);
export default projectRouter;
