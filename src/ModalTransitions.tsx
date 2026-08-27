import * as React from "react";

import { delay, noop } from "./lib";
import { useIsMounted } from "./useIsMounted";
import { useLatest } from "./useLatest";

export type Milliseconds = number;

type Props = {
    isOpen: boolean;
    onClosed?: () => void;
    transitionDuration: Milliseconds;
    render: (props: RenderProps) => React.ReactElement | null;
};

type RenderProps = {
    isOpen: boolean;
    stage: `${Stage.CLOSED | Stage.OPEN | Stage.OPENING | Stage.CLOSING}`; // Note: not rendering "unmounted" stage
    onClose: () => void;
};

export enum Stage {
    UNMOUNTED = "unmounted",
    OPEN = "open",
    OPENING = "opening",
    CLOSING = "closing",
    CLOSED = "closed",
}

export function ModalTransitions({ isOpen: shouldOpen, onClosed, transitionDuration, render }: Props) {
    const isMounted = useIsMounted();
    const [stage, setStage] = React.useState<Stage>(Stage.UNMOUNTED);
    const refs = useLatest({
        stage,
        onClosed,
        transitionDuration,
    });

    const onOpen = React.useCallback(() => {
        if (!isMounted()) {
            return noop;
        }

        if (refs.current.stage === Stage.OPENING || refs.current.stage === Stage.OPEN) {
            return noop; // Nothing to do
        }

        let cancel = false;

        // First, render it closed
        setStage(Stage.CLOSED);

        // Then, immediately start "opening" sequence
        delay(0)
            .then(() => setStage(Stage.OPENING))
            .then(() => delay(refs.current.transitionDuration)) // Wait another `transitionDelay`
            .then(() => {
                if (cancel || !isMounted()) {
                    return;
                }
                // Mark it open.
                setStage(Stage.OPEN);
            });

        return () => {
            cancel = true;
        };
    }, []);

    const onClose = React.useCallback(() => {
        if (!isMounted()) {
            return noop;
        }

        if (refs.current.stage === Stage.CLOSING || refs.current.stage === Stage.CLOSED) {
            return noop; // Nothing to do
        }

        let cancel = false;

        setStage(Stage.CLOSING);
        delay(refs.current.transitionDuration)
            .then(() => {
                if (cancel || !isMounted()) {
                    return;
                }
                setStage(Stage.CLOSED);
                refs.current.onClosed?.();
            })
            .then(() => delay(0))
            .then(() => setStage(Stage.UNMOUNTED));

        return () => {
            cancel = true;
        };
    }, []);

    React.useEffect(() => {
        if (shouldOpen) {
            return onOpen();
        } else {
            return onClose();
        }
    }, [open]);

    if (stage === Stage.UNMOUNTED) {
        // Do not render anything in "unmounted" stage
        return null;
    }

    return render({
        stage,
        isOpen: stage === Stage.OPEN || stage === Stage.OPENING,
        onClose,
    });
}
