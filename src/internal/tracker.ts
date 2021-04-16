import type { Computed } from '../computed';
import type { Notifier } from './subscriber';
import type { Subject } from './subject';

import array_uniq from 'array-uniq';


type Operator
    = () => void;
type TaskList<T extends Subject>
    = Array<Task<T>>;

interface Task<T extends Subject> {
    owner: T;
    operator: Operator;
}

class Computations {
    private __subscribers: Map<Notifier, Computed>
        = new Map;
    private __stack: Array<Notifier>
        = [ ];

    public get current(): { fn: Notifier; owner: Computed } {
        const fn = this.__stack[0];
        return { fn, owner: this.__subscribers.get(fn) };
    }

    public add(owner: Computed, subscriber: Notifier): void {
        this.__subscribers.set(subscriber, owner);
        this.__stack.unshift(subscriber);
    }

    public done(): void {
        this.__subscribers.delete(this.current.fn);
        this.__stack.shift();
    }
}

class Actions {
    private __depth: number
        = 0;
    private __subscribers: TaskList<Subject>
        = [ ];
    private __notifiers: TaskList<Computed>
        = [ ];
    private __recalculations: TaskList<Computed>
        = [ ];

    public get is_active(): boolean {
        return this.__depth > 0;
    }

    public start(): void {
        this.__depth++;
        // console.log(`Starting action with depth ${this.__depth}.`);
    }

    public done(): void {
        // console.log('DDDDD', this.__depth);
        // console.log(`Finishing action with depth ${this.__depth}.`);
        this.__depth--;
        if (this.__depth === 0) this.__execute();
    }

    public subscriber(
        owner: Subject,
        operator: Operator,
    ): void {
        if (this.is_active) {
            this.__subscribers.push({ owner, operator });
        } else {
            operator();
        }
    }

    public notifier(
        owner: Computed,
        operator: Operator,
    ): void {
        if (this.is_active) {
            this.__notifiers.push({ owner, operator });
        } else {
            operator();
        }
    }

    public recalculation(
        owner: Computed,
        operator: Operator,
    ): void {
        if (this.is_active) {
            this.__recalculations.push({ owner, operator });
        } else {
            operator();
        }
    }

    private __execute(): void {
        // console.log(`Executing actions.`);

        const consume = <T extends Subject>(tracker: TaskList<T>, filter?: (owner: T) => boolean) => {
            const deduped_notifiers
                = this.__reverse_dedup(tracker, ({ owner }) => owner);
            tracker.length
                = 0;

            for (const { owner, operator } of deduped_notifiers) {
                // console.log('DDDDDD', owner, operator);

                if (filter && !filter(owner)) continue;
                operator();
            }
        };

        const notifiers = this.__notifiers;
        const recalculations = this.__recalculations;
        const subscribers = this.__subscribers;

        /***/

        while(!!notifiers.length || !!recalculations.length) {

            // at first, dedupes and runs the notifications
            consume(notifiers, (owner) => !owner.dirty);

            // then, dedupes and runs the recalculations
            consume(recalculations, (owner) => owner.dirty);

        }

        // finally, runs all the subscribers

        // consume(subscribers, (owner) => {
        //     if (owner instanceof Computed) return owner.dirty;
        //     return true;
        // });

        consume(subscribers/*, ({ dirty }) => dirty*/);

    }

    private __reverse_dedup<T, U>(set: Iterable<T>, mapper?: (i: T) => U): Array<T> {
        let array: Array<U | T>;
        let index: Map<U, T>;
        let result: Array<T>;

        // apply mapper if any
        if (!mapper) {
            array = [...set];
        } else {
            index = new Map;
            array = [ ];
            result = [ ];

            for (const item of set) {
                const key = mapper(item);
                index.set(key, item);
                array.push(key);
            }
        }

        // deduplicate from the backward direction
        array.reverse();
        array = array_uniq(array);
        array.reverse();

        // return
        if (!result) {
            return <Array<T>> array;
        }

        for (const key of array) {
            result.push(index.get(<U> key));
        }

        return result;
    }
}

const computations = new Computations;
const actions = new Actions;

export { computations, actions };
