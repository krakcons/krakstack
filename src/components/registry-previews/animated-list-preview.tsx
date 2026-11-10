import { useRef, useState } from "react";
import { AnimatedList } from "@/components/ui/animated-list";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const AnimatedListPreview = () => {
  const add = useRef<HTMLButtonElement>(null);
  const reverse = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState({ next: 4, items: [1, 2, 3] });
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Button
          ref={add}
          type="button"
          variant="outline"
          disabled={state.items.length >= 6}
          onClick={() =>
            setState((current) => ({
              next: current.next + 1,
              items: [...current.items, current.next],
            }))
          }
        >
          {m.interactions_add_item()}
        </Button>
        <Button
          ref={reverse}
          type="button"
          variant="outline"
          disabled={state.items.length < 2}
          onClick={() =>
            setState((current) => ({
              ...current,
              items: [...current.items].reverse(),
            }))
          }
        >
          {m.interactions_reverse_items()}
        </Button>
      </div>
      <AnimatedList
        items={state.items}
        getKey={String}
        onReorder={(items) => setState((current) => ({ ...current, items }))}
        getItemLabel={(item) => m.interactions_item({ count: item })}
        locale={getLocale()}
        label={m.interactions_example_list()}
        itemClassName="flex items-center gap-3 rounded-lg border bg-background p-3"
      >
        {(item) => (
          <>
            <span className="min-w-0 flex-1 text-sm">
              {m.interactions_item({ count: item })}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label={m.interactions_remove_item({ count: item })}
              onClick={() => {
                if (add.current?.disabled) reverse.current?.focus();
                else add.current?.focus();
                setState((current) => ({
                  ...current,
                  items: current.items.filter((value) => value !== item),
                }));
              }}
            >
              {m.interactions_remove()}
            </Button>
          </>
        )}
      </AnimatedList>
      <p className="text-muted-foreground text-sm">
        {m.interactions_reorder_help()}
      </p>
      <p className="text-muted-foreground text-sm">
        {m.interactions_motion_help()}
      </p>
    </div>
  );
};
