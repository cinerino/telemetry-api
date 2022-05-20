"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 組織ルーター
 */
const express_1 = require("express");
const project_1 = require("./organizations/project");
const organizationsRouter = (0, express_1.Router)();
organizationsRouter.use('/project', project_1.default);
exports.default = organizationsRouter;
