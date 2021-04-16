import type { ID } from '../internal/subscriber';
import { Subject } from '../internal/subject';

class SubjectsMap {
    private readonly __map = new WeakMap<any, Map<ID, Subject>>();

    public get(instance: any, id: ID, initializer: () => Subject): Subject {
        let local = this.__map.get(instance);

        if (!local) {
            local = new Map<string, Subject>();
            this.__map.set(instance, local);
        }

        let subject = local.get(id);
        if (subject) return subject;
        subject = initializer();
        local.set(id, subject);

        return subject;
    }
}

const MAP = new SubjectsMap;
export { MAP };
