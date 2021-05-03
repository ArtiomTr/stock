import { Stock } from './useStock';
import { StockProxy } from '../typings/StockProxy';
import { useStockValue } from './useStockValue';
import { ROOT_PATH } from 'pxth';

export const useAllStockValues = <T extends object = object>(customStock?: Stock<T>, proxy?: StockProxy): T => {
    return useStockValue<T, T>((ROOT_PATH as unknown) as string, customStock, proxy);
};
