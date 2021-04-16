import type { Observable } from './internal/observable';
import type { Subscriber, ID } from './internal/subscriber';

import { PlainSubject, Subject } from './internal/subject';
import { MAP } from './utils/subjects-map';

export interface Value<T> extends Observable<T> {
    (incoming?: T): Value<T> | T;
}

interface Options {
    id?: ID;
    decorator?: boolean;
}

/***/

const value = function<T = any>(initial?: T, { id, decorator }: Options = { }) {
    let internal: Subject<T>;

    const lazy = (context?: any): Subject<T> => {
        const initializer = () => new PlainSubject<T>(initial, id);

        if (decorator) {
            return MAP.get(context, id, initializer);
        } else {
            if (!internal) internal = initializer();
            return internal;
        }
    };

    const self = function(incoming?: any) {
        if (arguments.length) {
            return lazy(this).write(incoming);
        } else {
            return lazy(this).read();
        }
    };

    if (!decorator) {

        self.subscribe = (subscriber: Subscriber<T>, options?: { id?: ID }) => {
            const subscription = lazy().subscribe(subscriber, options);
            return { unsubscribe: () => subscription.unsubscribe(subscriber) }
        };

        self.unsubscribe = (subscriber: Subscriber<T>) => {
            lazy().unsubscribe(subscriber);
        };

    }

    return self;
};

export { value };
