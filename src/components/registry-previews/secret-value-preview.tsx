import { SecretValue } from "@/components/ui/secret-value";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

export const SecretValuePreview = () => (
  <div className="mx-auto grid max-w-md gap-6">
    <SecretValue
      locale={getLocale()}
      value="example_key_not_a_real_credential"
      label={m.new_components_example_key()}
      autoHideDelay={5000}
    />
    <SecretValue
      locale={getLocale()}
      value="example_disabled_value"
      label={m.new_components_disabled_key()}
      disabled
    />
    <p className="text-muted-foreground text-sm">
      {m.new_components_secret_help()}
    </p>
  </div>
);
