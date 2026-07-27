import { type RefObject, useEffect } from "react";

type DismissibleLayerOptions = {
  open: boolean;
  onDismiss: () => void;
  containerRef: RefObject<HTMLElement | null>;
  triggerRef?: RefObject<HTMLElement | null>;
  dismissOnOutsidePress?: boolean;
};

export function useDismissibleLayer({
  open,
  onDismiss,
  containerRef,
  triggerRef,
  dismissOnOutsidePress = true
}: DismissibleLayerOptions) {
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (dismissOnOutsidePress && !containerRef.current?.contains(event.target as Node)) onDismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onDismiss();
      triggerRef?.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [containerRef, dismissOnOutsidePress, onDismiss, open, triggerRef]);
}
