import * as React from "react";

import { delay } from "./lib";
import { useLatest } from "./useLatest";
import { useNextFrameEffect } from "./useNextFrameEffect";

export type Milliseconds = number;

type Props = {
    isOpen: boolean;
    onClosed?: () => void;
    transitionDuration: Milliseconds;
    render: (props: RenderProps) => React.ReactElement | null;
};

type RenderProps = {
    isOpen: boolean;
    onClose: () => void;
};

export enum Stage {
    UNMOUNTED = "unmounted",
    STANDBY = "standby", // same as "closed", but before "opening"
    OPEN = "open",
    OPENING = "opening",
    CLOSING = "closing",
    CLOSED = "closed", // same as "standby", but after "closing"
}

export function ModalTransitions({ isOpen: shouldOpen, onClosed, transitionDuration, render }: Props) {
    const [stage, setStage] = React.useState<Stage>(Stage.UNMOUNTED);
    const refs = useLatest({
        stage,
        onClosed,
        transitionDuration,
    });

    const onOpen = React.useCallback(() => {
        setStage((stage) => {
            // If it's UNMOUNTED or CLOSED: switch to STANDBY to prepare for OPENING.
            if (stage === Stage.UNMOUNTED || stage === Stage.CLOSED) {
                setStage(Stage.STANDBY);
            }

            // If it's CLOSING: override and start OPENING.
            if (stage === Stage.CLOSING) {
                setStage(Stage.OPENING);
            }

            // If opening is requested while it's STANDBY, OPENING or already OPEN: do nothing.
            // The `useLayoutEffect()` hook below will do the rest.
            return stage;
        })
    }, []);

    const onClose = React.useCallback(() => {
        setStage((stage) => {
            // If it's OPENING or already OPEN: override and start CLOSING.
            if (stage === Stage.OPENING || stage === Stage.OPEN) {
                return Stage.CLOSING;
            }

            // If it was in STANDBY preparing for OPENING: override and mark CLOSED.
            if (stage === Stage.STANDBY) {
                return Stage.CLOSED;
            }

            // If opening is requested while it's UNMOUNTED, CLOSING or already CLOSED: do nothing.
            // The `useLayoutEffect()` hook below will do the rest.
            return stage;
        });
    }, []);

    useNextFrameEffect(() => {
        let cancel = false;

        if (stage === Stage.STANDBY) {
            // If it's in STANDBY (no longer unmounted, prepared for opening): start OPENING.
            setStage(Stage.OPENING);
        }

        if (stage === Stage.OPENING) {
            // Allow the transitions to happen and then switch to OPEN.
            delay(refs.current.transitionDuration).then(() => {
                // If the OPENING sequence was not canceled with later calls, mark it OPEN.
                if ( ! cancel) {
                    setStage(Stage.OPEN);
                }
            });
        }

        if (stage === Stage.CLOSING) {
            delay(refs.current.transitionDuration).then(() => {
                // If the CLOSING sequence was not canceled with later calls, mark it CLOSED.
                if ( ! cancel) {
                    setStage(Stage.CLOSED);
                }
            });
        }

        if (stage === Stage.CLOSED) {
            // Once the CLOSED state is rendered, trigger the onClosed callback and immediately switch to UNMOUNTED
            refs.current.onClosed?.();
            setStage(Stage.UNMOUNTED);
        }

        return () => {
            cancel = true;
        };
    }, [stage]);

    React.useEffect(() => {
        if (shouldOpen) {
            return onOpen();
        } else {
            return onClose();
        }
    }, [shouldOpen]);

    if (stage === Stage.UNMOUNTED) {
        // Do not render anything in "unmounted" stage
        return null;
    }

    return render({
        isOpen: stage === Stage.OPEN || stage === Stage.OPENING,
        onClose,
    });
}
