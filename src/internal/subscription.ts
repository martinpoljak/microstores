import type { Subscriber } from './subscriber';

export interface Subscription<T = any> {
    unsubscribe(subscriber?: Subscriber<T>): void;
}
