import { value } from './value';

export function observable(target: any, name: string) {
    const val = value(undefined, { id: name, decorator: true });

    Object.defineProperty(target, name, {
        set: val, get: val,
    });
}
