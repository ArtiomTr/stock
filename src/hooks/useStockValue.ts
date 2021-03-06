import { useEffect, useReducer } from 'react';

import { Stock } from './useStock';
import { useLazyRef } from '../utils/useLazyRef';
import { useStockContext } from './useStockContext';
import { StockProxy } from '../typings';

/**
 * Hook, which returns *actual* stock value.
 * This means, it will update component each time when value in stock changes.
 * @param path        - path to variable in stock, deeply gets value. @see https://lodash.com/docs/4.17.15#get
 * @param customStock - optional parameter, if you want to work with custom stock, not received from context. @see useStockContext
 * @param proxy       - optional parameter, if you want to pass custom proxy, not receive it from context. @see useStockContext
 */
export const useStockValue = <V, T extends object = object>(
    path: string,
    customStock?: Stock<T>,
    proxy?: StockProxy
): V => {
    const stock = useStockContext(customStock, proxy);

    const { watch, getValue } = stock;

    const [, forceUpdate] = useReducer(val => val + 1, 0);

    const value = useLazyRef<V>(() => getValue<V>(path));

    useEffect(
        () =>
            watch(path, (newValue: V) => {
                value.current = newValue;
                forceUpdate();
            }),
        [path, watch, value]
    );

    return value.current;
};
