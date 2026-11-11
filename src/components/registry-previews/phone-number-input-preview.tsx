import { useState } from "react";
import type { CountryCode } from "libphonenumber-js";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { getLocale } from "@/paraglide/runtime";

export const PhoneNumberInputPreview = () => {
  const [value, setValue] = useState("4165550123");
  const [country, setCountry] = useState<CountryCode>("CA");
  return (
    <PhoneNumberInput
      value={value}
      onValueChange={setValue}
      country={country}
      onCountryChange={setCountry}
      locale={getLocale()}
    />
  );
};
