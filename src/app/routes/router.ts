/**
 * ルーター
 */
import * as express from 'express';

import healthRouter from './health';
import organizationsRouter from './organizations';

const router = express.Router();

// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })

router.use('/health', healthRouter);
router.use('/organizations', organizationsRouter);
export default router;
