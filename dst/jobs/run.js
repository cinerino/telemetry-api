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
 * 非同期ジョブ
 */
const run_1 = require("./continuous/abortTasks/run");
const run_2 = require("./continuous/analyzeGMONotification/run");
// import analyzePlaceOrder from './continuous/analyzePlaceOrder/run';
const run_3 = require("./continuous/analyzeSendGridEvent/run");
const run_4 = require("./continuous/retryTasks/run");
exports.default = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, run_1.default)();
    yield (0, run_2.default)();
    // await analyzePlaceOrder();
    yield (0, run_3.default)();
    yield (0, run_4.default)();
});
