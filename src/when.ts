import { reaction } from './reaction';

export function when(predicate: () => boolean): Promise<void> {
    return new Promise<void>((resolve) => {
        reaction(predicate, (ok: boolean) => { if (ok) resolve(); });
    });
}
