import toPath from 'lodash/toPath';
import get from 'lodash/get';
import set from 'lodash/set';
import invariant from 'tiny-invariant';
import { ROOT_PATH } from '../hooks/useObservers';

/**
 * Function, which normalizes path.
 *
 * @example
 *
 * array[0].value.1.child -> array.0.value.1.child
 * path["to"][0].variable["yes"] -> path.to.0.variable.yes
 *
 * @param path - path to normalize
 */
export const normalizePath = (path: string | typeof ROOT_PATH) =>
    path === ROOT_PATH
        ? ((path as unknown) as string)
        : toPath(path)
              .join('.')
              .trim();

/**
 * Function, which indicates, if path is child of another or not.
 *
 * @example
 *
 * isInnerPath('parent', 'parent.child') -> true
 * isInnerPath('notParent', 'parent.child') -> false
 *
 * @param _basePath - path, which is probably parent
 * @param _path - path, which is probably child of _basePath
 */
export const isInnerPath = (_basePath: string | typeof ROOT_PATH, _path: string | typeof ROOT_PATH) => {
    if (_basePath === ROOT_PATH || _path === ROOT_PATH) return true;
    const path = normalizePath(_path);
    const basePath = normalizePath(_basePath);
    return path.indexOf(basePath + '.') === 0 && path.replace(basePath, '').trim().length > 0;
};

/**
 * Provides same functionality, as @see https://lodash.com/docs/4.17.15#get
 * @param object - object, where should be value taken
 * @param path - path to deep variable
 */
export const getOrReturn = (object: unknown, path: string | typeof ROOT_PATH) => {
    if (path === ROOT_PATH) {
        return object;
    } else {
        return get(object, path);
    }
};

/**
 * Provides same functionality, as @see https://lodash.com/docs/4.17.15#set
 * @param object - object, where should be set
 * @param path - path to set deep variable
 * @param value - value to set
 */
export const setOrReturn = (object: object, path: string | typeof ROOT_PATH, value: unknown) => {
    if (path === ROOT_PATH) {
        return value;
    } else {
        return set(object, path, value);
    }
};

/**
 * Finds longest common path.
 * @example
 * ['hello.world', 'hello.world.yes', 'hello.world.bye.asdf'] -> 'hello.world'
 * ['a', 'b', 'c'] -> ''
 */
export const longestCommonPath = (paths: string[]) => {
    if (paths.length === 0) return '';
    if (paths.length === 1) return normalizePath(paths[0]);
    const sortedPaths = paths.sort();
    const firstPath = toPath(sortedPaths[0]);
    const lastPath = toPath(sortedPaths[sortedPaths.length - 1]);
    for (let i = 0; i < firstPath.length; i++) {
        if (firstPath[i] !== lastPath[i]) {
            return firstPath.slice(0, i).join('.');
        }
    }
    return firstPath.join('.');
};

/**
 * Returns relative path. If subPath is not child of basePath, it will throw an error.
 * @example
 * relativePath('hello.world', 'hello.world.asdf') -> 'asdf',
 * relativePath('a.b.c', 'a.b.c.d.e') -> 'd.e',
 * relativePath('a', 'b') -> Error
 */
export const relativePath = (_basePath: string, _subPath: string) => {
    const basePath = normalizePath(_basePath);
    const subPath = normalizePath(_subPath);

    if (basePath.trim().length === 0) return _subPath;

    invariant(subPath.indexOf(basePath) === 0, `"${subPath}" is not sub path of "${basePath}"`);

    if (basePath === subPath) {
        return (ROOT_PATH as unknown) as string;
    } else {
        return subPath.replace(basePath + '.', '');
    }
};
