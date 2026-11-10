import { useState } from "react";
import { Mail, MessageSquare } from "lucide-react";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { m } from "@/paraglide/messages";

export const ChoiceCardsPreview = () => {
  const [single, setSingle] = useState<string | null>("email");
  const [multiple, setMultiple] = useState<string[]>(["email"]);
  const options = [
    {
      value: "email",
      label: m.new_components_email(),
      description: m.new_components_email_description(),
      icon: <Mail />,
    },
    {
      value: "message",
      label: m.new_components_message(),
      description: m.new_components_message_description(),
      icon: <MessageSquare />,
    },
  ];
  return (
    <div className="grid gap-8">
      <ChoiceCards
        mode="single"
        name="primary-channel"
        label={m.new_components_primary_channel()}
        options={options}
        value={single}
        onValueChange={setSingle}
      />
      <ChoiceCards
        mode="multiple"
        name="channels"
        label={m.new_components_channels()}
        options={options}
        value={multiple}
        onValueChange={setMultiple}
      />
    </div>
  );
};
