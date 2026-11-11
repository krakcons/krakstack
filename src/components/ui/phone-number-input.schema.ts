import { Schema } from "effect";
import {
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";

/** ITU-T E.164: up to 15 digits, including the country calling code, excluding extensions. */
export const E164DigitsSchema = Schema.String.check(
  Schema.isPattern(/^\d*$/),
  Schema.isMaxLength(15),
).annotate({ identifier: "E164Digits" });

/** Use the parser’s national-prefix normalization when available, even for incomplete/invalid numbers. */
export const getPhoneNumberDigits = (value: string, country: CountryCode) => {
  if (!value) return "";
  const parsed = parsePhoneNumberFromString(value, {
    defaultCountry: country,
    extract: false,
  });
  if (parsed) return parsed.number.slice(1);
  const digits = value
    .replace(/(?:ext\.?|x|#|;ext=)\s*\d+\s*$/i, "")
    .replace(/\D/g, "");
  return value.trimStart().startsWith("+")
    ? digits
    : `${getCountryCallingCode(country)}${digits}`;
};

export const fitsE164DigitLimit = (value: string, country: CountryCode) =>
  Schema.is(E164DigitsSchema)(getPhoneNumberDigits(value, country));
