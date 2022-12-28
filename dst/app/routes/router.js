"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ルーター
 */
const express = require("express");
const health_1 = require("./health");
const organizations_1 = require("./organizations");
const webhooks_1 = require("./webhooks");
const router = express.Router();
// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })
router.get('', (__, res) => {
    res.send('hello!');
});
router.use('/health', health_1.healthRouter);
router.use('/organizations', organizations_1.default);
router.use('/webhooks', webhooks_1.default);
exports.default = router;
