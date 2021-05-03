import { useObservers } from '../../src';
import { renderHook, act } from '@testing-library/react-hooks';
import { ROOT_PATH } from 'pxth';

const renderUseObserversHook = () => renderHook(() => useObservers());

describe('Observer tests', () => {
    it('should call value observer', () => {
        const { result } = renderUseObserversHook();

        const observer = jest.fn();

        act(() => {
            result.current.watch('b', observer);
            result.current.notifySubTree('b', {
                b: 0,
            });
        });

        expect(observer).toBeCalled();
    });

    it('Should call all values observer', async () => {
        const { result } = renderUseObserversHook();

        const observer = jest.fn();
        let cleanup: () => void = () => {};

        act(() => {
            cleanup = result.current.watchAll(observer);
            result.current.notifySubTree('b', { b: 0 });
        });

        expect(observer).toBeCalled();
        expect(result.current.isObserved((ROOT_PATH as unknown) as string)).toBe(true);
        cleanup();
        expect(result.current.isObserved((ROOT_PATH as unknown) as string)).toBe(false);
    });

    it('should call parent observer', () => {
        const { result } = renderUseObserversHook();

        const observer = jest.fn();

        act(() => {
            result.current.watch('parent', observer);
            result.current.notifySubTree('parent.child', {
                parent: {
                    child: 0,
                },
            });
        });

        expect(observer).toBeCalled();
    });

    it('should call child observer', () => {
        const { result } = renderUseObserversHook();

        const observer = jest.fn();

        act(() => {
            result.current.watch('parent.child', observer);
            result.current.notifySubTree('parent', { parent: { child: 'b' } });
        });

        expect(observer).toBeCalled();
    });

    it('should call tree branch of observers', () => {
        const { result } = renderUseObserversHook();

        const observer = jest.fn();

        act(() => {
            result.current.watch('parent', observer);
            result.current.watch('parent.child', observer);
            result.current.watch('parent.child.value', observer);
            result.current.notifySubTree('parent.child.value', {
                parent: {
                    child: {
                        value: 'b',
                    },
                },
            });
        });

        expect(observer).toBeCalledTimes(3);
    });

    it('should call all observers', () => {
        const { result } = renderUseObserversHook();

        const oberver = jest.fn();

        act(() => {
            result.current.watch('parent', oberver);
            result.current.watch('parent.child', oberver);
            result.current.watch('parent.child.value', oberver);
            result.current.notifyAll({ parent: { child: { value: 'b' } } });
        });

        expect(oberver).toBeCalledTimes(3);
    });

    it("shouldn't call observer", () => {
        const { result } = renderUseObserversHook();

        const observer = jest.fn();

        act(() => {
            result.current.watch('parent.notInBranch', observer);
            result.current.notifySubTree('parent.child.value', {
                parent: {
                    child: {
                        value: 'newValue',
                    },
                    notInBranch: {
                        value: 'asdf',
                    },
                },
            });
        });

        expect(observer).not.toBeCalled();
    });

    it('should receive correct value', () => {
        const { result } = renderUseObserversHook();

        const value = 'hello';

        const parentObserver = jest.fn();
        const childObserver = jest.fn();

        act(() => {
            result.current.watch('parent', parentObserver);
            result.current.watch('parent.child', childObserver);
            result.current.notifySubTree('parent.child', {
                parent: {
                    child: value,
                },
            });
        });

        expect(childObserver).toBeCalledWith(value);
        expect(parentObserver).toBeCalledWith({ child: value });
    });
});

describe('Is observed test', () => {
    it('should be observed', () => {
        const { result } = renderUseObserversHook();

        act(() => {
            result.current.watch('value', jest.fn());
        });

        expect(result.current.isObserved('value')).toBeTruthy();
        expect(result.current.isObserved('asdf')).toBeFalsy();
    });
    it('should be observed denormalized path', () => {
        const { result } = renderUseObserversHook();

        act(() => {
            result.current.watch('arr[0]', jest.fn());
        });

        expect(result.current.isObserved('arr[0]')).toBeTruthy();
        expect(result.current.isObserved('arr.0')).toBeTruthy();
        expect(result.current.isObserved('arr[3]')).toBeFalsy();
    });
});

describe('Removing observers test', () => {
    it('should remove observer', () => {
        const { result } = renderUseObserversHook();

        const observer = jest.fn();

        act(() => {
            const cleanup = result.current.watch('value', observer);

            result.current.notifySubTree('value', { value: '2' });

            cleanup();

            result.current.notifySubTree('value', { value: '3' });
        });

        expect(observer).toBeCalledTimes(1);
    });

    it('should remove denormalized path observer', () => {
        const { result } = renderUseObserversHook();

        const observer = jest.fn();

        act(() => {
            const cleanup = result.current.watch('arr[0]', observer);

            result.current.notifySubTree('arr.0', { arr: [0] });
            result.current.notifySubTree('arr[0]', { arr: [1] });

            cleanup();

            result.current.notifySubTree('arr.0', { arr: [2] });
            result.current.notifySubTree('arr[0]', { arr: [3] });
        });

        expect(observer).toBeCalledTimes(2);
    });
});

describe('Batch observers tests', () => {
    it('should call observer', () => {
        const { result } = renderUseObserversHook();

        const observer = jest.fn();

        act(() => {
            result.current.watchBatchUpdates(observer);

            result.current.notifySubTree('value', {
                value: '2',
            });
        });

        expect(observer).toBeCalled();
    });

    it('should call observer on any update with arguments', () => {
        const { result } = renderUseObserversHook();

        const observer = jest.fn();

        act(() => {
            result.current.watchBatchUpdates(observer);
            result.current.watch('parent.child', jest.fn());
            result.current.watch('parent', jest.fn());
            result.current.watch('value', jest.fn());

            result.current.notifySubTree('parent.child.hello', {
                value: 'asdf',
                parent: {
                    child: {
                        hello: '2',
                    },
                },
            });
        });

        expect(observer).toBeCalled();
        expect(observer).toBeCalledWith({
            paths: ['parent.child', 'parent'],
            values: {
                value: 'asdf',
                parent: {
                    child: {
                        hello: '2',
                    },
                },
            },
        });
    });

    it('should remove observer', () => {
        const { result } = renderUseObserversHook();

        const observer = jest.fn();

        act(() => {
            const cleanup = result.current.watchBatchUpdates(observer);

            result.current.notifySubTree('value', {
                value: '2',
            });

            cleanup();

            result.current.notifySubTree('value', {
                value: 'h',
            });
        });

        expect(observer).toBeCalledTimes(1);
    });
});
