"use client";

import {
  type Component,
  MessageLog,
  Renderer,
  View as EffectView,
} from "@effect/ui";
import { BrowserHost, Html } from "@effect/ui/html";
import { Cause, Effect, Fiber } from "effect";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

interface Node {
  parent?: Node;
  children: Node[];
}

const node = (): Node => ({ children: [] });

type Snapshot<Model> = { readonly model: Model } | { readonly error: Error };

// Only retain node positions for the Effect UI renderer. JSX owns the DOM.
const modelHost = (commit: () => void): Renderer.Host<Node> => {
  const remove = (child: Node) => {
    if (!child.parent) return;
    child.parent.children.splice(child.parent.children.indexOf(child), 1);
    delete child.parent;
  };
  return {
    createElement: node,
    createText: node,
    createContainer: node,
    setText: () => {},
    setAttr: () => {},
    setProp: () => {},
    setEvents: () => {},
    insertBefore: (parent, child, before) => {
      if (child === before) return;
      remove(child);
      const index = before
        ? parent.children.indexOf(before)
        : parent.children.length;
      parent.children.splice(index, 0, child);
      child.parent = parent;
    },
    remove,
    parentOf: (child) => child.parent,
    nextOf: (child) =>
      child.parent?.children[child.parent.children.indexOf(child) + 1],
    elements: ["html"],
    controlled: new Set(),
    runsMounts: false,
    commit,
  };
};

// Proof of concept for model-driven views, not a DOM host for Html mounts.
export const effectUiToReact = <
  Name extends string,
  Props extends object,
  Model,
  Msg,
>(
  component: Component.Members<
    Name,
    Props,
    Model,
    Msg,
    never,
    never,
    Html.Elements
  >,
  initialModel: (props: NoInfer<Props>) => NoInfer<Model>,
  View: (input: {
    props: NoInfer<Props>;
    model: NoInfer<Model>;
    send: (message: NoInfer<Msg>) => void;
  }) => ReactNode,
  options?: { readonly messageLog?: MessageLog.MessageLog },
) => {
  const Widget = (props: Props) => {
    const [store] = useState(() => {
      const initial = { model: initialModel(props) };
      let snapshot: Snapshot<Model> = initial;
      const listeners = new Set<() => void>();
      return {
        subscribe: (listener: () => void) => {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        getSnapshot: () => snapshot,
        getServerSnapshot: () => initial,
        publish: (next: Snapshot<Model>) => {
          if (
            "model" in snapshot &&
            "model" in next &&
            Object.is(snapshot.model, next.model)
          )
            return;
          if (
            "error" in snapshot &&
            "error" in next &&
            snapshot.error === next.error
          )
            return;
          snapshot = next;
          listeners.forEach((listener) => listener());
        },
      };
    });
    const snapshot = useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getServerSnapshot,
    );
    const committed = useRef(props);
    const root = useRef<Renderer.Root<Model, Msg, Props> | undefined>(
      undefined,
    );
    const send = useCallback((message: Msg) => root.current?.send(message), []);

    useLayoutEffect(() => {
      committed.current = props;
      root.current?.setProps(props);
    }, [props]);

    useEffect(() => {
      let active = true;
      let failure: Error | undefined;
      const publish = () => {
        if (!active) return;
        if (failure) {
          store.publish({ error: failure });
          return;
        }
        const current = root.current?.model();
        if (current !== undefined) store.publish({ model: current });
      };
      const fiber = Effect.runFork(
        Effect.scoped(
          Effect.gen(function* () {
            const initialProps = committed.current;
            const mounted = yield* Renderer.mount(
              component,
              initialProps,
              node(),
              {
                head: false,
                fallback: ({ cause }) => {
                  failure = new Error("Effect UI root failed", {
                    cause: Cause.squash(cause),
                  });
                  return EffectView.text("");
                },
              },
            );
            if (!active) return;
            root.current = mounted;
            if (initialProps !== committed.current)
              mounted.setProps(committed.current);
            publish();
            yield* Effect.never;
          }).pipe(
            Effect.provide(Renderer.layer(modelHost(publish))),
            Effect.provideService(Html.Host, BrowserHost.htmlHost),
            Effect.provideService(
              MessageLog.MessageLog,
              options?.messageLog ?? MessageLog.noop,
            ),
          ),
        ),
      );
      return () => {
        active = false;
        root.current = undefined;
        Effect.runFork(Fiber.interrupt(fiber));
      };
    }, [store]);

    if ("error" in snapshot) throw snapshot.error;
    return <View props={props} model={snapshot.model} send={send} />;
  };
  return Widget;
};
