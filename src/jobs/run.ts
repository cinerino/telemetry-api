/**
 * 非同期ジョブ
 */
import abortTasks from './continuous/abortTasks/run';
import analyzeGMONotification from './continuous/analyzeGMONotification/run';
// import analyzePlaceOrder from './continuous/analyzePlaceOrder/run';
import analyzeSendGridEvent from './continuous/analyzeSendGridEvent/run';
import retryTasks from './continuous/retryTasks/run';

export default async () => {
    await abortTasks();
    await analyzeGMONotification();
    // await analyzePlaceOrder();
    await analyzeSendGridEvent();
    await retryTasks();
};
