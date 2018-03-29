## monotask

`monotask` provides a simple way to mark selected asynchronous functions as tasks belonging to a task queue. Calls to
such functions are automatically serialised so that they execute strictly one-at-a-time. Tasks within a task queue may
also call other tasks in a nested manner, in which case the behaviour is exactly like that of nested synchronous
function calls. That is, the outer task is suspended until the subtask completes, and then the outer task resumes.

An example use case is ensuring that commands in a CQRS system can only run one-at-a-time, while still allowing commands
to: (a) be ordinary functions, which clients call in an ordinary manner; (b) execute asynchronously, for example
querying a database as part of command validation; and (c) call other commands in a nested manner.

## Installation
```
npm install monotask
```


## Example Usage
```ts
import monotask from 'monotask';

// Create a new task queue. `mono` is a wrapper used to mark functions that will be part of this queue.
let mono = monotask.create();

// An ordinary async function that does some kind of work.
function asyncWork(name: string, duration: number) {
    return new Promise(resolve => {
        console.log(`Enter ${name}`);
        setTimeout(() => {
            console.log(`Leave ${name}`);
            resolve();
        }, duration);
    });
}

// A wrapped version of the `asyncWork` function that only allows serialised execution.
const serialWork = mono(asyncWork);

// The main test code
(async function main() {

    // Test normal (unserialised) behaviour for comparison
    console.log('\n===== Not serialised =====');
    await Promise.all([
        asyncWork('Task 1', 50),
        asyncWork('Task 2', 40),
        asyncWork('Task 3', 50),
        asyncWork('Task 4', 30),
    ]);

    // Test serialised behaviour
    console.log('\n===== Serialised =====');
    await Promise.all([
        serialWork('Task 1', 50),
        serialWork('Task 2', 40),
        serialWork('Task 3', 50),
        serialWork('Task 4', 30),
    ]);
})();

// Output:
// ===== Not serialised =====
// Enter Task 1
// Enter Task 2
// Enter Task 3
// Enter Task 4
// Leave Task 4
// Leave Task 2
// Leave Task 1
// Leave Task 3
//
// ===== Serialised =====
// Enter Task 1
// Leave Task 1
// Enter Task 2
// Leave Task 2
// Enter Task 3
// Leave Task 3
// Enter Task 4
// Leave Task 4
```





## Remarks
- requires node v8.1 or above (due to dependence on `async_hooks` module).
- TypeScript declarations included
- assumes tasks don't return before they complete. E.g. the following task violates this assumption:
```ts
async function badTask() {
    await doStuff(); // good
    setTimeout(doStuffAfterReturn, 50); // bad
    return;
}
```
