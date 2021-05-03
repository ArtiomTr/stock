import { useCallback } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';
import isFunction from 'lodash/isFunction';

import { useLazyRef } from '../utils/useLazyRef';
import { SetStateAction } from '../typings/SetStateAction';
import { ObserversControl, useObservers } from './useObservers';
import { get, toPxth } from 'pxth';

export type Stock<T extends object> = {
    /** Function for setting value. Deeply sets value, using path to variable. @see https://lodash.com/docs/4.17.15#set */
    setValue: (path: string, value: unknown) => void;
    /** Function for setting all values. */
    setValues: (values: T) => void;
    /** Get actual value from stock. */
    getValue: <V>(path: string) => V;
    /** Get all values from stock */
    getValues: () => T;
    /** Function for resetting values to initial state */
    resetValues: () => void;
} & Omit<ObserversControl<T>, 'notifyAll' | 'notifySubTree'>;

export type StockConfig<T extends object> = {
    initialValues: T;
};

/**
 * Creates stock.
 *
 * Use it only if you want to use several Stock's at the same time.
 *
 * Instead, use `<StockRoot>` component
 *
 * @param config - configuration of Stock.
 */
export const useStock = <T extends object>({ initialValues }: StockConfig<T>): Stock<T> => {
    const values = useLazyRef<T>(() => cloneDeep(initialValues));
    const { notifySubTree, notifyAll, ...other } = useObservers<T>();

    const setValue = useCallback(
        (path: string, action: SetStateAction<unknown>) => {
            const value = isFunction(action) ? action(get(values.current, toPxth(path))) : action;

            set(values.current, path, value);

            notifySubTree(path, values.current);
        },
        [values, notifySubTree]
    );

    const setValues = useCallback(
        (newValues: T) => {
            values.current = newValues;
            notifyAll(newValues);
        },
        [values, notifyAll]
    );

    const getValue = useCallback(<V>(path: string) => get<T, V>(values.current, toPxth(path))!, [values]);

    const getValues = useCallback(() => values.current, [values]);

    const resetValues = useCallback(() => setValues(cloneDeep(initialValues)), [initialValues, setValues]);

    return {
        getValue,
        getValues,
        setValue,
        setValues,
        resetValues,
        ...other,
    };
};
