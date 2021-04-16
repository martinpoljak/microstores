export type Subscriber<T> = (newer: T, older?: T) => void;
export type Notifier = (dirtify: boolean) => void;
export type ID = string | number;
