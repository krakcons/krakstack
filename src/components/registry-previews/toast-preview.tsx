import { useId, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToastProvider,
  useToast,
  type ToastPosition,
} from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

const ToastExamples = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const examples = [
    {
      type: "success",
      label: m.toast_demo_success(),
      title: m.toast_demo_saved(),
    },
    {
      type: "info",
      label: m.toast_demo_info(),
      title: m.toast_demo_info_title(),
    },
    {
      type: "warning",
      label: m.toast_demo_warning(),
      title: m.toast_demo_warning_title(),
    },
    {
      type: "error",
      label: m.toast_demo_error(),
      title: m.toast_demo_error_title(),
    },
  ];
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <Button
            key={example.type}
            type="button"
            variant="outline"
            onClick={() =>
              toast.add({
                id: `demo-${example.type}`,
                title: example.title,
                description: m.toast_demo_description(),
                type: example.type,
              })
            }
          >
            {example.label}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            toast.add({
              id: "demo-action",
              title: m.toast_demo_action_title(),
              type: "info",
              timeout: 0,
              actionProps: {
                children: m.toast_demo_undo(),
                onClick: () => {
                  toast.close("demo-action");
                  toast.add({
                    title: m.toast_demo_restored(),
                    type: "success",
                  });
                },
              },
            })
          }
        >
          {m.toast_demo_action()}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            toast.add({
              id: "demo-progress",
              title: m.toast_demo_loading_title(),
              type: "loading",
              timeout: 0,
            });
          }}
        >
          {m.toast_demo_loading()}
        </Button>
        {loading ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLoading(false);
              toast.update("demo-progress", {
                title: m.toast_demo_complete_title(),
                type: "success",
                timeout: 5000,
              });
            }}
          >
            {m.toast_demo_complete()}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            toast.close();
            setLoading(false);
          }}
        >
          {m.toast_demo_clear()}
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">{m.toast_demo_help()}</p>
    </div>
  );
};
export const ToastPreview = () => {
  const id = useId();
  const [position, setPosition] = useState<ToastPosition>("bottom-right");
  const positions: readonly { value: ToastPosition; label: string }[] = [
    { value: "top-left", label: m.toast_demo_top_left() },
    { value: "top-center", label: m.toast_demo_top_center() },
    { value: "top-right", label: m.toast_demo_top_right() },
    { value: "bottom-left", label: m.toast_demo_bottom_left() },
    { value: "bottom-center", label: m.toast_demo_bottom_center() },
    { value: "bottom-right", label: m.toast_demo_bottom_right() },
  ];
  return (
    <ToastProvider locale={getLocale()} position={position}>
      <div className="grid gap-4">
        <div className="grid w-fit max-w-full gap-2 text-sm font-medium">
          <label htmlFor={id}>{m.toast_demo_position()}</label>
          <Select
            items={positions}
            value={position}
            onValueChange={(value) => {
              const next = positions.find((option) => option.value === value);
              if (next) setPosition(next.value);
            }}
          >
            <SelectTrigger id={id} className="w-48 max-w-full font-normal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {positions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ToastExamples />
      </div>
    </ToastProvider>
  );
};
