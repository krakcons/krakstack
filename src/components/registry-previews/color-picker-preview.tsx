import { useState } from "react";
import { ColorPicker } from "@krak-stack/registry/color-picker";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import * as m from "@/paraglide/messages";

export const ColorPickerPreview = () => {
  const [color, setColor] = useState("#2563EB");

  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>{m.color_picker_preview_title()}</CardTitle>
        <CardDescription>
          {m.color_picker_preview_description()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        <ColorPicker
          className="max-w-64"
          value={color}
          onValueChange={setColor}
        />
      </CardContent>
    </Card>
  );
};
