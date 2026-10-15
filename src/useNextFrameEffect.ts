import { useEffect } from "react";

import { noop } from "./lib";
import { useEffectEvent } from "./useEffectEvent";

type CleanupFn = () => void;

export function useNextFrameEffect(callback: () => CleanupFn, deps: unknown[]) {
    const freshCallback = useEffectEvent(callback);

    useEffect(() => {
        let cleanup = noop;
        const frame = requestAnimationFrame(() => {
            cleanup = freshCallback();
        });

        return () => {
            cleanup();
            cancelAnimationFrame(frame);
        };
    }, deps);
}
