
import type { Computed } from '../computed';
import type { Notifier, Subscriber, ID } from './subscriber';
import type { Observable } from './observable';

import { action } from '../action';
import { actions, computations } from './tracker';
import { REGISTRY } from '../registry';
import type { Subscription } from './subscription';

type SubscribersMap<T>
    = Map<Subscriber<T>, ID>;
type NotifiersMap
    = Map<Notifier, { id: ID; owner: Computed }>;

interface SubscribeOptions {
    id?: ID;
    now?: boolean;
}

export interface Subject<T = any> extends Observable<T> {
    readonly id: ID;
    readonly dirty: boolean;
    readonly subscribers: SubscribersMap<T>;

    read(): T;
    write(value: T): void;
    notify(owner: Computed, notifier: Notifier, id?: ID): void;
    subscribe(subscriber: Subscriber<T>, options?: SubscribeOptions): Subscription<T>;
}

export class PlainSubject<T = any> implements Subject<T> {
    private __subscribers: SubscribersMap<T>;

    protected __notifiers: NotifiersMap;
    protected __value: T;

    public readonly id: ID;

    public get dirty(): boolean {
        return true;
    }

    public get subscribers(): SubscribersMap<T> {
        if (this.__subscribers) return this.__subscribers;
        return this.__subscribers = new Map;
    }

    public get notifiers(): NotifiersMap {
        if (this.__notifiers) return this.__notifiers;
        return this.__notifiers = new Map;
    }

    public constructor(value?: T, id?: ID) {
        this.id = id;
        // if (typeof value !== 'undefined') this.write(value);
        this.__value = value;
    }

    public read(): T {
        this.__log('reading');
        // console.log(computations.current);
        const { fn, owner } = computations.current;
        if (fn) this.notify(owner, fn, owner?.id);
        return this.__value;
    }

    public write(value: T): void {
        const old: T = this.__value;
        if (value === old) return;

        action(() => {
            this.__log(`writing "${value}"`);
            this.__value = value;
            this.__notify();
            this.__announce(old, value);
        });
    }

    public subscribe(subscriber: Subscriber<T>, options: SubscribeOptions = { }): Subscription<T> {
        if (this.subscribers.has(subscriber)) return;
        options.now ??= true;
        const { id, now } = options;

        this.__log(`subscribing "${id}"`);
        if (now) subscriber(this.__value);
        this.subscribers.set(subscriber, id);
        return this;
    }

    public unsubscribe(subscriber: Subscriber<T>): void {
        this.__log(`unsubscribing ${subscriber}`);
        this.subscribers.delete(subscriber);
    }

    public notify(owner: Computed, notifier: Notifier, id?: ID): void {
        if (this.notifiers.has(notifier)) return;
        this.__log(`notifier of "${id}" received, ${this.notifiers.size} in total`);
        this.notifiers.set(notifier, { id, owner });
    }

    /***/

    protected __announce(older: T, newer: T): void {
        if (!this.__subscribers?.size) return;
        this.__log(`announcing to ${this.__subscribers.size} subscribers in total`);

        actions.subscriber(this, () => {
            for (const [subscriber, id] of this.__subscribers) {
                this.__log(`announcing to "${id}"`);
                subscriber(newer, older);
            }
        });

        // for (const [subscriber, id] of this.__subscribers) {
        //     this.__log(`announcing to "${id}"`);
        //     actions.subscriber(subscriber, [newer, older]);
        // }
    }

    protected __notify({ dirtify }: { dirtify: boolean } = { dirtify: true }): void {
        if (!this.__notifiers) return;
        this.__log(`going to notifying ${this.__notifiers.size} notifiers in total`);

        for (const [notifier, { id, owner }] of this.__notifiers) {
            this.__log(`scheduling notification of "${id}"`);
            // notifier(dirtify);
            actions.notifier(owner, () => {
                this.__log(`notifying "${id}"`);
                notifier(dirtify);
            });
            // actions.schedule(notifier, [dirtify]);
        }
    }

    protected __log(message: string) {
        if (!REGISTRY.debug) return;

        // tslint:disable-next-line:no-console
        if(this.id) console.log(`${this.id}: ${message}`);
    }
}
