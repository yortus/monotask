import AsyncLocalStorage from './async-local-storage';





/**
 * Creates a new serialised task queue. Use the returned function to
 * wrap all functions whose calls are to be serialised into this queue.
 */
export default function create() {

    // Async local storage is used to track which task is active, and to keep metadata about
    // all tasks that have been called/initiated and whose results are awaited. Only one of
    // these tasks is the current task. All other tasks are blocked waiting for it to finish.
    const als = new AsyncLocalStorage<TaskInfo>();

    // This special task represents the global calling scope for this task queue. I.e., it
    // is used as the current task for callers that are not themselves inside a running task.
    const GLOBAL_ENV = new TaskInfo();

    // Return a decorator function that delays each call to its wrapped function
    // in such a way that serialised execution guarantees are always maintained.
    return function wrap<F extends (...args: any[]) => Promise<any>>(fn: F): F {
        return (async function wrapped(...args: any[]) {

            // The wrapped call will be treated as a subtask of the calling task.
            // Top-level tasks are treated as subtasks of the special `GLOBAL_ENV` task.
            let callingTask = als.data || GLOBAL_ENV;

            // Delay starting this subtask until the calling task has no other subtasks in progress.
            // This ensures top-level tasks only start when there are no other top-level tasks running.
            // It also correctly serialises nested subtasks that are started in the same tick. For example,
            // when a parent task has code like `await Promise.all([sub1(), sub2(), sub3()])`.
            let result = callingTask.noSubtasksPending.then(async () => {

                // This subtask is cleared to start. Create metadata for it and mark it as the current task.
                als.data = new TaskInfo();

                // Execute the wrapped function and return its result (or reject with its error).
                return fn(...args);
            });

            // When the subtask completes (or fails), then the calling task is ready for more subtasks.
            // If a series of tasks are started synchronously, they will be chained into this promise
            // and will execute serially as each prior one completes (or fails).
            callingTask.noSubtasksPending = result.catch(() => undefined);
            return result;
        }) as F;
    };
}





/** Metadata about a currently running task. All we need to know is whether it has currently running subtasks. */
class TaskInfo {
    noSubtasksPending = Promise.resolve();
}
