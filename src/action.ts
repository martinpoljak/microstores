import { actions } from './internal/tracker';
import is_promise from 'p-is-promise';

export function action(target: any, name: string, descriptor: PropertyDescriptor): void;
export function action(fn: () => any | Promise<any>): void;
export function action(...args: Array<any>): void {

    // decorator
    if (typeof args[0] !== 'function') {
        const [target, name, descriptor] = args;

        return Object.defineProperty(target, name, {
            value: action.bind(null, descriptor.value.bind(target)),
        });
    }

    /***/

    actions.start();
    const result = args[0]();

    if (is_promise(result)) {
        result.then(() => actions.done());
    } else {
        actions.done();
    }

}

// MobX compatibility
const runInAction = action;
export { runInAction };
