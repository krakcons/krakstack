import { useState } from "react";
import {
  SelectWithCustomInput,
  type SelectWithCustomInputValue,
} from "@/components/ui/select-with-custom-input";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const SelectWithCustomInputPreview = () => {
  const [value, setValue] = useState<SelectWithCustomInputValue | null>(null);
  return (
    <div className="mx-auto w-full max-w-sm">
      <SelectWithCustomInput
        label={m.custom_select_demo_label()}
        description={m.custom_select_demo_help()}
        locale={getLocale()}
        options={[
          { value: "woman", label: m.custom_select_demo_woman() },
          { value: "man", label: m.custom_select_demo_man() },
          { value: "non-binary", label: m.custom_select_demo_nonbinary() },
          {
            value: "self-described",
            label: m.custom_select_demo_other(),
            input: {
              label: m.custom_select_demo_custom_label(),
              maxLength: 80,
            },
          },
          { value: "undisclosed", label: m.custom_select_demo_undisclosed() },
        ]}
        value={value}
        onValueChange={setValue}
      />
    </div>
  );
};
