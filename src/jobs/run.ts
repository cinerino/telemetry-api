/**
 * 非同期ジョブ
 */
import abortTasks from './continuous/abortTasks/run';
import retryTasks from './continuous/retryTasks/run';

export default async () => {
    await abortTasks();
    await retryTasks();
};
