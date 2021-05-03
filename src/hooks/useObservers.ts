import { useCallback, useRef } from 'react';
import invariant from 'tiny-invariant';
import { BatchUpdate, Observer } from '../typings';
import { ObserverArray, ObserverKey } from '../utils/ObserverArray';
import { get, isNestedPath, toObjectKey, toPxth, ROOT_PATH } from 'pxth';
import { useLazyRef } from '../utils/useLazyRef';

export type ObserversControl<T> = {
    /** Watch stock value. Returns cleanup function. */
    watch: <V>(path: string, observer: Observer<V>) => () => void;
    /** Watch all stock values. Returns cleanup function. */
    watchAll: (observer: Observer<T>) => () => void;
    /** Check if value is observed or not. */
    isObserved: (path: string) => boolean;
    /** Notify all observers, which are children of specified path */
    notifySubTree: (path: string, values: T) => void;
    /** Notify all observers */
    notifyAll: (values: T) => void;
    /** "stocked" updates values in batches, so you can subscribe to batch updates. Returns cleanup. */
    watchBatchUpdates: (observer: Observer<BatchUpdate<T>>) => () => void;
};

/** Hook, wraps functionality of observers storage (add, remove, notify tree of observers, etc.) */
export const useObservers = <T>(): ObserversControl<T> => {
    const observers = useRef<Record<string, ObserverArray<unknown>>>({});
    const batchUpdateObservers = useLazyRef<ObserverArray<BatchUpdate<T>>>(() => new ObserverArray());

    const getObserversKeys = useCallback(
        () => [
            ...Object.keys(observers.current),
            ...((Object.getOwnPropertySymbols(observers.current) as unknown) as string[]),
        ],
        []
    );

    const batchUpdate = useCallback(
        (update: BatchUpdate<T>) => {
            batchUpdateObservers.current.call(update);
        },
        [batchUpdateObservers]
    );

    const observeBatchUpdates = useCallback(
        (observer: Observer<BatchUpdate<T>>) => batchUpdateObservers.current.add(observer),
        [batchUpdateObservers]
    );

    const stopObservingBatchUpdates = useCallback((key: ObserverKey) => batchUpdateObservers.current.remove(key), [
        batchUpdateObservers,
    ]);

    const observe = useCallback(<V>(path: string, observer: Observer<V>) => {
        const objectKey = toObjectKey(toPxth(path));
        if (!Object.prototype.hasOwnProperty.call(observers.current, objectKey)) {
            observers.current[objectKey as string] = new ObserverArray();
        }
        return observers.current[objectKey as string].add(observer as Observer<unknown>);
    }, []);

    const stopObserving = useCallback((path: string, observerKey: ObserverKey) => {
        const objectKey = toObjectKey(toPxth(path));
        const currentObservers = observers.current[objectKey as string];

        invariant(currentObservers, 'Cannot remove observer from value, which is not observing');

        currentObservers.remove(observerKey);

        if (currentObservers.isEmpty()) delete observers.current[objectKey as string];
    }, []);

    const watch = useCallback(
        <V>(path: string, observer: Observer<V>) => {
            const key = observe(path, observer);
            return () => stopObserving(path, key);
        },
        [observe, stopObserving]
    );

    const watchAll = useCallback((observer: Observer<T>) => watch((ROOT_PATH as unknown) as string, observer), [watch]);

    const watchBatchUpdates = useCallback(
        (observer: Observer<BatchUpdate<T>>) => {
            const key = observeBatchUpdates(observer);
            return () => stopObservingBatchUpdates(key);
        },
        [observeBatchUpdates, stopObservingBatchUpdates]
    );

    const isObserved = useCallback(
        (path: string) => Object.prototype.hasOwnProperty.call(observers.current, toObjectKey(toPxth(path))),
        []
    );

    const notifyPaths = useCallback(
        (paths: string[], values: T) => {
            batchUpdate({ paths, values });
            paths.forEach(path => {
                const observer = observers.current[path];
                const subValue = get(values, toPxth(path));
                observer.call(subValue);
            });
        },
        [batchUpdate]
    );

    const notifySubTree = useCallback(
        (path: string, values: T) => {
            const pxth = toPxth(path);
            const subPaths = getObserversKeys().filter(objectKey => {
                const nestedPxth = toPxth(objectKey);

                return isNestedPath(pxth, nestedPxth) || isNestedPath(nestedPxth, pxth);
            });
            notifyPaths(subPaths, values);
        },
        [notifyPaths, getObserversKeys]
    );

    const notifyAll = useCallback((values: T) => notifyPaths(getObserversKeys(), values), [
        notifyPaths,
        getObserversKeys,
    ]);

    return {
        watch,
        watchAll,
        watchBatchUpdates,
        isObserved,
        notifySubTree,
        notifyAll,
    };
};
