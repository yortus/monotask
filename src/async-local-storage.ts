import * as async_hooks from 'async_hooks';
import * as fs from 'fs';




/**
 * Allows arbitrary user-defined data to be associated with an asynchronous execution context, similar to thread-local
 * storage. The data associated with a context is inherited by all asynchronous execution contexts whose creation is
 * causally triggered by that context. Data may be stored, retrieved, and replaced for the currently executing context
 * using the `data` getter/setter.
 */
export default class AsyncLocalStorage<T extends object> {

    constructor(options?: Partial<Options>) {
        this.options = Object.assign({}, DEFAULT_OPTIONS, options);
        this.items = new Map();
        this.initAsyncHook();
    }

    dispose() {
        this.asyncHook.disable();
        this.items.clear();
    }

    get data(): T | undefined {
        let asyncId = async_hooks.executionAsyncId();
        return this.items.get(asyncId);
    }

    set data(value: T | undefined) {
        // TODO: already init'ed child contexts won't see this change. Is that a bug or a feature?
        let asyncId = async_hooks.executionAsyncId();
        if (value === undefined) {
            this.items.delete(asyncId);
        }
        else {
            this.items.set(asyncId, value);
        }
    }

    private options: Options;

    private items: Map<number, T>;

    private asyncHook: async_hooks.AsyncHook;

    private initAsyncHook() {
        this.asyncHook = async_hooks.createHook({
            init: (asyncId, _, triggerAsyncId) => {
                // Propagate items to new async contexts.
                let item = this.items.get(triggerAsyncId);
                if (item) this.items.set(asyncId, item);
                if (this.options.trace) fs.writeSync(1, `--- INIT: ${this.items.size} items ---\n`);
            },
            destroy: asyncId => {
                // Remove items for destroyed async contexts.
                this.items.delete(asyncId);
                if (this.options.trace) fs.writeSync(1, `--- DSTR: ${this.items.size} items ---\n`);
            },
        }).enable();
    }
}





export interface Options {
    trace: boolean;
}





const DEFAULT_OPTIONS: Options = {trace: false};
