import * as React from "react";

/**
 * A shim for the React 19 `useEffectEvent()` hook,
 * which is not available in React 18.
 * @see https://react.dev/reference/react/useEffectEvent
 */
export const useEffectEvent = React.useEffectEvent ?? function useEffectEvent<Args extends unknown[], Result>(
    callback: (...args: Args) => Result,
): (...args: Args) => Result {
    const ref = React.useRef(callback);

    React.useLayoutEffect(() => {
        ref.current = callback;
    });

    return React.useCallback((...args: Args) => ref.current(...args), []);
}
