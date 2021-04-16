import { computed } from './computed';

type Predicate<T> = () => T;
type Operator<T> = (result: T) => void;

export function reaction<T = any>(
    predicate: Predicate<T>,
    operator: Operator<T>,
) {
    computed(predicate, { id: '[reaction]' })
        .subscribe(operator, { id: '[reaction operator]' });
}
