/**
 * 組織ルーター
 */
import { Router } from 'express';

import projectRouter from './organizations/project';

const organizationsRouter = Router();
organizationsRouter.use('/project', projectRouter);
export default organizationsRouter;
