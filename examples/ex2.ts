// TODO: temp testing... remove...
// tslint:disable:no-shadowed-variable
// tslint:disable:no-console
import monotask from 'monotask';





function wrap2(fn: Function) {
    return mono(async (...args: any[]) => {
        ++depth;
        let indent = '  '.repeat(depth - 1);
        console.log(`${indent}ENTER ${fn.name}`);
        let result = await fn(...args);
        console.log(`${indent}LEAVE ${fn.name}`);
        --depth;
        return result;
    });
}
let depth = 0;
let mono = monotask.create();





async function primary() {
    await foo();
    await bar();
    await baz();
    await Promise.all([
        baz(),
        foo(),
        bar(),
        bar(),
        foo(),
    ]);
    await baz();
}
const foo = wrap2(async function foo() {
    await delay(10);
    const foo1 = wrap2(async function foo1() {
        await delay(20);
    });
    const foo2 = wrap2(async function foo2() {
        await delay(30);
    });
    await Promise.all([foo2(), foo1()]);
    await delay(10);
});
const bar = wrap2(async function bar() {
    await delay(30);
});
const baz = wrap2(async function baz() {
    await delay(40);
});





async function secondary() {
    await Promise.all([
        blah(),
        quux(),
        quux(),
    ]);
}
const quux = wrap2(async function quux() {
    await delay(10);
    const quux1 = wrap2(async function quux1() {
        await delay(20);
    });
    const quux2 = wrap2(async function quux2() {
        await delay(30);
    });
    await Promise.all([quux2(), quux1()]);
    await delay(10);
});
const blah = wrap2(async function blah() {
    await delay(30);
});





(async function main() {
    let p = primary();
    await delay(15);
    let s = secondary();
    await Promise.all([p, s]);
})();





function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
