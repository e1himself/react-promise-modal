import * as React from "react";

type UseEffectEvent = typeof useEffectEventShim;

/**
 * A shim for the React 19 `useEffectEvent()` hook,
 * which is not available in React 18.
 * @see https://react.dev/reference/react/useEffectEvent
 */
export const useEffectEvent: UseEffectEvent =
    // `useEffectEvent` is only available natively since React 19.2,
    // and it's not declared in React 18 typings, hence the type-cast.
    (React as { useEffectEvent?: UseEffectEvent }).useEffectEvent ?? useEffectEventShim;

function useEffectEventShim<Args extends unknown[], Result>(
    callback: (...args: Args) => Result,
): (...args: Args) => Result {
    const ref = React.useRef(callback);

    React.useLayoutEffect(() => {
        ref.current = callback;
    });

    return React.useCallback((...args: Args) => ref.current(...args), []);
}
