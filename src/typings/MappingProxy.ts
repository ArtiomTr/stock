import { get, isNestedPath, longestCommonPath, Pxth, relativePath, ROOT_PATH, set, toObjectKey, toPxth } from 'pxth';
import invariant from 'tiny-invariant';
import { Observer } from './Observer';
import { StockProxy } from './StockProxy';

/**
 * Simple example of StockProxy.
 * Proxies values by map. Map is built by this method:
 * {
 *      "<relative path to variable, inside proxied value>": "<path to real value, in stock>"
 * }
 */
export class MappingProxy extends StockProxy {
    private readonly map: Record<string, Pxth>;

    public constructor(map: Record<string, string>, path: string) {
        super(path);
        this.map = Object.entries(map).reduce<Record<string, Pxth>>((acc, [key, value]) => {
            acc[key] = toPxth(value);
            return acc;
        }, {});
    }

    public setValue = (path: string, value: unknown, defaultSetValue: (path: string, value: unknown) => void) => {
        const pxth = toPxth(path);

        const innerPaths = Object.entries(this.map).filter(([to]) => isNestedPath(pxth, toPxth(to)));

        innerPaths
            .sort((a, b) => a.length - b.length)
            .forEach(([to, from]) =>
                defaultSetValue(toObjectKey(from) as string, get(value, relativePath(pxth, toPxth(to))))
            );
    };

    public watch = <V>(
        path: string,
        observer: Observer<V>,
        defaultWatch: (path: string, observer: Observer<V>) => () => void
    ) => {
        const proxiedPath = this.getProxiedPath(path);
        return defaultWatch(toObjectKey(proxiedPath) as string, value =>
            observer(this.mapValue(value, toPxth(path), proxiedPath) as V)
        );
    };

    public getValue = <V>(path: string, defaultGetValue: <U>(path: string) => U): V => {
        const proxiedPath = this.getProxiedPath(path);
        return this.mapValue(defaultGetValue(toObjectKey(proxiedPath) as string), toPxth(path), proxiedPath) as V;
    };

    private mapValue = (value: unknown, path: Pxth, proxiedPath: Pxth): unknown => {
        const pxth = relativePath(toPxth(this.path), path);
        const innerPaths = Object.entries(this.map).filter(([to]) => isNestedPath(pxth, toPxth(to)));
        return innerPaths.reduce<unknown>(
            (acc, [to, from]) =>
                set(acc as object, relativePath(pxth, toPxth(to)), get(value, relativePath(proxiedPath, from))),
            {}
        );
    };

    private getProxiedPath = (path: string) => {
        const normalPath = relativePath(toPxth(this.path), toPxth(path));

        const normalPathAsObjectKey = toObjectKey(normalPath);

        const isIndependent = Object.prototype.hasOwnProperty.call(this.map, normalPathAsObjectKey);

        invariant(
            isIndependent ||
                normalPathAsObjectKey === ROOT_PATH ||
                Object.keys(this.map).findIndex(proxiedPath => isNestedPath(normalPath, toPxth(proxiedPath))) !== -1,
            `Mapping proxy error: trying to proxy value, which is not defined in proxy map. \n${JSON.stringify(
                this.map
            )}\n${JSON.stringify(normalPath)}`
        );

        return isIndependent
            ? this.map[toObjectKey(normalPath) as string]
            : longestCommonPath(
                  Object.entries(this.map)
                      .filter(([to]) => isNestedPath(normalPath, toPxth(to)))
                      .map(([, from]) => from)
              );
    };
}
