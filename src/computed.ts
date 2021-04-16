import type { ID } from './internal/subscriber';
import type { Value } from './value';

import { MAP } from './utils/subjects-map';
import { PlainSubject, Subject } from './internal/subject';
import { computations } from './internal/tracker';

type Operator<T>
    = () => T;

export interface Computed<T = any> extends Subject<T> {
    /* empty */
}

export class PlainComputed<T = any> extends PlainSubject implements Computed<T> {
    private __dirty: boolean = true;
    private __computing: boolean = false;
    private readonly notifier: () => void;

    public get dirty(): boolean {
        return this.__dirty;
    }


    public constructor(private readonly __fn?: Operator<T>, id?: ID) {
        super(undefined, id);

        this.notifier = (dirtify: boolean = true) => {
            if (this.__computing) {
                this.__log(`notified, ignored as already computing`);
                return;
            }

            if (this.subscribers.size) {
                this.__log(`notified, recalculating because of ${this.subscribers.size} subscribers`);
                this.__compute();
                this.__notify({ dirtify: false });
            } else {
                this.__log('notified, marking dirty');
                this.__dirty = true;
                this.__value = undefined;
                this.__notify({ dirtify });
            }
        };

        this.__compute();
    }

    public read(): T {
        if (this.__dirty) this.__compute();
        return super.read();
    }

    public write(_value: T): void {
        throw new Error('Computed subject has no setter.');
    }

    // public subscribe(subscriber: Subscriber<T>): void {

    //     super.subscribe(subscriber);
    // }

    private __compute() {
        this.__log('computing');
        this.__computing = true;
        computations.add(this, this.notifier);

        const fn: Operator<T> = this.__fn;
        const result: T = fn();
        this.__dirty = false;
        super.write(result);

        this.__computing = false;
        computations.done();
    }

    // private __notify({ dirtify }: { dirtify: boolean } = { dirtify: true }): void {
    //     if (!this.__notifiers) return;
    //     this.__log(`notifying ${this.__notifiers.size} subscribers in total`);

    //     for (const [notifier, { id, owner }] of this.__notifiers) {
    //         this.__log(`notifying "${id}"`);
    //         actions.notifier(owner, () => notifier(dirtify));
    //     }
    // }
}

/***/

interface Options {
    id?: ID;
    decorator?: boolean;
}

export function computed(target: any, name: string, descriptor: PropertyDescriptor): void;
export function computed<T = any>(fn: Operator<T>, options?: Options): Value<T>;
export function computed<T = any>(...args: Array<any>): void | Value<T> {
    const is_decorator = typeof args[0] !== 'function';

    // decorator
    if (is_decorator) {
        const [target, name, descriptor] = args;

        return Object.defineProperty(target, name, {
            // get: computed(descriptor.get.bind(target), name),
            get: computed(descriptor.get, { id: name, decorator: true }),
            // get() { return computed(descriptor.get.bind(this), name); },     // tslint:disable-line:no-invalid-this
        });
    }

    /***/

    let internal: Computed<T>;
    const [fn, options] = args;
    const { id, decorator } = options || { };

    const lazy = (context?: any): Computed<T> => {
        const initializer = () => new PlainComputed<T>(fn.bind(context), id);

        if (decorator) {
            return MAP.get(context, id, initializer);
        } else {
            if (!internal) internal = initializer();
            return internal;
        }

        // if (internal) return internal;
        // return internal = new PlainComputed<T>(fn.bind(context), id);
    };

    const self = <any> function(this: any, incoming?: T) {
        if (arguments.length) {
            return lazy(this).write(incoming);
        } else {
            return lazy(this).read();
        }
    };

    if (!decorator) {

        self.subscribe = (subscriber: Value<any>, options?: { id?: ID }) => {
            const subscription = lazy().subscribe(subscriber, options);
            return { unsubscribe: () => subscription.unsubscribe(subscriber) }
        };

        self.unsubscribe = (subscriber: Value<any>) => {
            lazy().unsubscribe(subscriber);
        };

    }

    return self;
}
