import React, { PropsWithChildren } from 'react';
import { useStockContext } from '../hooks';
import { StockProxy } from '../typings';
import { ProxyContext } from './ProxyContext';
import { StockContext } from './StockContext';

export type ProxyProviderProps = PropsWithChildren<{
    proxy: StockProxy;
}>;

export const ProxyProvider = ({ proxy, children }: ProxyProviderProps) => {
    const stock = useStockContext();

    return (
        <StockContext.Provider value={stock}>
            <ProxyContext.Provider value={proxy}>{children}</ProxyContext.Provider>
        </StockContext.Provider>
    );
};
