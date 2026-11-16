import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

// Shared implementation details, not a Motion-compatible public interface.
const useBrowserLayoutEffect = globalThis.window ? useLayoutEffect : useEffect;
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (notify: () => void) => {
  const query = window.matchMedia?.(reducedMotionQuery);
  query?.addEventListener("change", notify);
  return () => query?.removeEventListener("change", notify);
};
export const useReducedMotion = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia?.(reducedMotionQuery).matches ?? true,
    () => true,
  );

/** Cancellation never completes an obsolete transition. Missing WAAPI settles immediately. */
export const animateElement = (
  element: HTMLElement,
  frames: Keyframe[],
  duration: number,
  complete?: () => void,
) => {
  if (duration <= 0 || !element.animate) {
    complete?.();
    return () => {};
  }
  const animation = element.animate(frames, {
    duration,
    easing: "cubic-bezier(0.2, 0, 0, 1)",
  });
  animation.onfinish = () => complete?.();
  return () => {
    animation.onfinish = null;
    animation.cancel();
  };
};

export const usePresence = (open: boolean, duration: number) => {
  const ref = useRef<HTMLDivElement>(null);
  const [retained, setRetained] = useState(open);
  const reduced = useReducedMotion();
  const lastOpen = useRef(open);
  const transitioning = useRef(false);
  const snapshot = useRef<{ opacity: string; transform: string } | null>(null);
  if (open && !retained) setRetained(true);
  useBrowserLayoutEffect(() => {
    const element = ref.current;
    if (lastOpen.current === open && !transitioning.current) return;
    lastOpen.current = open;
    if (!element) return;
    transitioning.current = true;
    const from =
      snapshot.current ??
      (open
        ? { opacity: "0", transform: "translateY(4px)" }
        : { opacity: "1", transform: "none" });
    snapshot.current = null;
    let settled = false;
    const cancel = animateElement(
      element,
      [
        from,
        { opacity: open ? 1 : 0, transform: open ? "none" : "translateY(4px)" },
      ],
      reduced ? 0 : Math.max(0, duration),
      () => {
        settled = true;
        transitioning.current = false;
        snapshot.current = null;
        if (!open) setRetained(false);
      },
    );
    return () => {
      snapshot.current = settled
        ? null
        : {
            opacity: getComputedStyle(element).opacity,
            transform: getComputedStyle(element).transform,
          };
      cancel();
    };
  }, [open, retained, duration, reduced]);
  return { ref, mounted: open || retained };
};

/** Retain removed keyed children in flow until their exit finishes. */
export const useKeyedPresence = <T>(
  items: readonly T[],
  getKey: (item: T) => string,
) => {
  const [previous, setPrevious] = useState(items);
  const [retained, setRetained] = useState(items);
  if (previous !== items) {
    const keys = new Set(items.map(getKey));
    const next = [...items];
    retained.forEach((item, index) => {
      if (!keys.has(getKey(item)))
        next.splice(Math.min(index, next.length), 0, item);
    });
    setPrevious(items);
    setRetained(next);
  }
  const present = new Set(items.map(getKey));
  return {
    items: retained,
    present,
    remove: (key: string) =>
      setRetained((current) => current.filter((item) => getKey(item) !== key)),
  };
};

/** FLIP position transitions leave layout and React's keyed children intact. */
export const useListLayout = (
  ref: RefObject<HTMLUListElement | null>,
  duration: number,
) => {
  const previous = useRef(new Map<string, { top: number; left: number }>());
  const animations = useRef(new Map<HTMLElement, () => void>());
  const reduced = useReducedMotion();
  useBrowserLayoutEffect(() => {
    const next = new Map<string, { top: number; left: number }>();
    for (const element of ref.current?.children ?? []) {
      if (!(element instanceof HTMLElement)) continue;
      const key = element.dataset.motionKey;
      if (!key) continue;
      const position = { top: element.offsetTop, left: element.offsetLeft };
      next.set(key, position);
      const old = previous.current.get(key);
      if (old && (old.top !== position.top || old.left !== position.left)) {
        const transform = getComputedStyle(element).transform;
        const interrupted =
          transform === "none" ? null : new DOMMatrixReadOnly(transform);
        animations.current.get(element)?.();
        if (!element.hasAttribute("data-dragging")) {
          animations.current.set(
            element,
            animateElement(
              element,
              [
                {
                  transform: `translate(${old.left - position.left + (interrupted?.m41 ?? 0)}px, ${old.top - position.top + (interrupted?.m42 ?? 0)}px)`,
                },
                { transform: "none" },
              ],
              reduced ? 0 : Math.max(0, duration),
            ),
          );
        }
      }
    }
    for (const [element, cancel] of animations.current) {
      if (!element.isConnected) {
        cancel();
        animations.current.delete(element);
      }
    }
    previous.current = next;
  });
  useEffect(
    () => () => {
      for (const cancel of animations.current.values()) cancel();
    },
    [],
  );
};

export const useNumberTransition = (value: number, duration: number) => {
  const [displayed, setDisplayed] = useState(value);
  const current = useRef(value);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (
      reduced ||
      duration <= 0 ||
      !Number.isFinite(value) ||
      !Number.isFinite(current.current)
    ) {
      current.current = value;
      setDisplayed(value);
      return;
    }
    const start = performance.now();
    const from = current.current;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      current.current = from + (value - from) * (1 - (1 - progress) ** 3);
      setDisplayed(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);
  return reduced ? value : displayed;
};

const setDragStyle = (
  element: HTMLElement,
  translate: string,
  active: boolean,
) => {
  element.style.translate = translate;
  element.style.zIndex = active ? "1" : "";
  element.toggleAttribute("data-dragging", active);
};

/** Pointer-only mechanics. The caller owns order, keyboard controls and announcements. */
export const useVerticalDrag = ({
  ref,
  container,
  enabled,
  overflow,
  onMove,
}: {
  ref: RefObject<HTMLLIElement | null>;
  container: RefObject<HTMLUListElement | null>;
  enabled: boolean;
  overflow: number;
  onMove: (target: number) => void;
}) => {
  const session = useRef<{
    pointer: number;
    start: number;
    y: number;
    grab: number;
    active: boolean;
    capture: HTMLUListElement;
    element: HTMLLIElement;
  } | null>(null);
  const update = () => {
    const drag = session.current;
    const element = drag?.element ?? ref.current;
    const list = container.current;
    if (!drag?.active || !element || !list) return;
    const bounds = list.getBoundingClientRect();
    const top = bounds.top + list.clientTop - list.scrollTop;
    const allowance = Math.max(0, overflow);
    const desired = Math.max(
      bounds.top - allowance,
      Math.min(
        bounds.bottom - element.offsetHeight + allowance,
        drag.y - drag.grab,
      ),
    );
    setDragStyle(element, `0 ${desired - top - element.offsetTop}px`, true);
    const center = desired + element.offsetHeight / 2;
    const siblings = [...list.children].filter(
      (child) =>
        child instanceof HTMLElement &&
        child.getAttribute("aria-hidden") !== "true",
    );
    const index = siblings.indexOf(element);
    let target = index;
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (!(sibling instanceof HTMLElement) || sibling === element) continue;
      const middle = top + sibling.offsetTop + sibling.offsetHeight / 2;
      if (i > index && center > middle) target = i;
      if (i < index && center < middle) {
        target = i;
        break;
      }
    }
    if (target !== index) onMove(target);
  };
  const end = () => {
    const drag = session.current;
    session.current = null;
    const element = drag?.element ?? ref.current;
    if (element) setDragStyle(element, "", false);
    if (drag?.capture.hasPointerCapture?.(drag.pointer))
      drag.capture.releasePointerCapture(drag.pointer);
  };
  const updateDrag = useEffectEvent(update);
  const endDrag = useEffectEvent(end);
  const connection = useRef({ generation: 0 });
  useBrowserLayoutEffect(() => {
    if (!enabled) end();
    else update();
  });
  useEffect(() => {
    const lifecycle = connection.current;
    const generation = ++lifecycle.generation;
    const scroll = () => updateDrag();
    const move = (event: PointerEvent) => {
      const drag = session.current;
      const element = ref.current;
      if (!drag || drag.pointer !== event.pointerId || !element) return;
      drag.y = event.clientY;
      if (!drag.active && Math.abs(drag.y - drag.start) < 4) return;
      drag.active = true;
      element.dataset.dragging = "";
      element.style.zIndex = "1";
      updateDrag();
    };
    const stop = (event: PointerEvent) => {
      if (session.current?.pointer === event.pointerId) endDrag();
    };
    // Capture scrolling ancestors as well as the viewport.
    document.addEventListener("scroll", scroll, true);
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", stop);
    document.addEventListener("pointercancel", stop);
    document.addEventListener("lostpointercapture", stop);
    window.addEventListener("resize", endDrag);
    return () => {
      document.removeEventListener("scroll", scroll, true);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", stop);
      document.removeEventListener("pointercancel", stop);
      document.removeEventListener("lostpointercapture", stop);
      window.removeEventListener("resize", endDrag);
      // Strict Mode can disconnect/reconnect effects when a keyed row moves.
      // A genuine unmount has no matching setup before this microtask runs.
      queueMicrotask(() => {
        if (lifecycle.generation === generation) endDrag();
      });
    };
  }, [ref]);
  return {
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!enabled || event.button !== 0 || session.current) return;
      const element = ref.current;
      const list = container.current;
      if (!element || !list) return;
      // Capture on a stable ancestor: moving keyed rows can release row capture.
      list.setPointerCapture(event.pointerId);
      session.current = {
        pointer: event.pointerId,
        start: event.clientY,
        y: event.clientY,
        grab: event.clientY - element.getBoundingClientRect().top,
        active: false,
        capture: list,
        element,
      };
    },
  };
};
