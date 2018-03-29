// TODO: temp testing... remove...
// tslint:disable:no-console
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
