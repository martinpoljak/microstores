import { computed } from './computed';
import { Value } from './value';

export function use<T = any>(callback: () => T): Value<T> {
    return computed(callback, { id: 'svelte' });
}
