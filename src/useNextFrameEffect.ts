import { useEffect, useEffectEvent } from "react";
import { noop } from "./lib";

type CleanupFn = () => void;

export function useNextFrameEffect(callback: () => CleanupFn, deps: unknown[]) {
    const stableCallback = useEffectEvent(callback);

    useEffect(() => {
        let cleanup = noop;
        const frame = requestAnimationFrame(() => {
            cleanup = stableCallback();
        });

        return () => {
            cleanup();
            cancelAnimationFrame(frame);
        };
    }, deps);
}