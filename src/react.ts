import { computed } from './computed';
import { useState, useEffect } from 'react';

export function use<T = any>(callback: () => T): T {
    const [state, setState] = useState<T>(callback());
    let initial = true;

    useEffect(() => {
        const subscription = computed(callback, { id: 'use' }).subscribe((v) => {
            if (!initial) setState(v);
            initial = false;
        }, { id: 'setstate'});

        return () => subscription.unsubscribe();
    });

    return state;
}
