import { Subscription, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Button } from "@effect/ui-kit";
import { Schema, Stream } from "effect";

export const CounterProps = Schema.Struct({
  initialCount: Schema.Int,
  step: Schema.Int.check(Schema.isGreaterThan(0)),
}).annotate({ identifier: "CounterProps" });
export type CounterProps = typeof CounterProps.Type;

const CounterModel = Schema.Struct({ count: Schema.Int }).annotate({
  identifier: "CounterModel",
});

export const CounterMessage = UiSchema.TaggedEnum({
  ClickedDecrement: {},
  ClickedIncrement: {},
  Ticked: {},
}).annotate({ identifier: "CounterMessage" });

export const initCounter = ({ initialCount }: CounterProps) => ({
  count: initialCount,
});

const autoIncrement = Subscription.make(
  "autoIncrement",
  Stream.tick("5 seconds").pipe(
    Stream.drop(1),
    Stream.map(() => CounterMessage.Ticked()),
  ),
);

export const Counter = Html.component({
  name: "Counter",
  props: CounterProps,
  model: CounterModel,
  message: CounterMessage,
}).make({
  init: ({ props }) => initCounter(props),
  update: {
    ClickedDecrement: ($) => $.evolve({ count: (n) => n - $.props.step }),
    ClickedIncrement: ($) => $.evolve({ count: (n) => n + $.props.step }),
    Ticked: ($) => $.evolve({ count: (n) => n + 1 }),
  },
  subscriptions: () => [autoIncrement],
  view: (h, model) =>
    h.div
      .class("button-group")
      .attr("role", "group")
      .attr("aria-label", "Counter / Compteur")
      .children(
        Button(h, { onPress: CounterMessage.ClickedDecrement() })
          .class("btn")
          .attr("data-variant", "outline")
          .attr("data-size", "icon")
          .children("−"),
        h.output(String(model.count)),
        Button(h, { onPress: CounterMessage.ClickedIncrement() })
          .class("btn")
          .attr("data-variant", "outline")
          .attr("data-size", "icon")
          .children("+"),
      ),
});
