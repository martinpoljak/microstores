import type { Subscriber, ID } from './subscriber';
import type { Subscription } from './subscription';

export interface Observable<T> extends Subscription<T> {
    subscribe(subscriber: Subscriber<T>, options?: { id?: ID }): Subscription<T>;
}
