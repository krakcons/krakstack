import { expect, test, type Page } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3016";
const visit = async (page: Page, locale: string, slug: string) => {
  await page.setViewportSize({
    width: locale === "fr" ? 320 : 1280,
    height: 1000,
  });
  await page.goto(`${origin}/${locale}/docs/${slug}`);
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  const name = locale === "fr" ? "Aperçu" : "Preview";
  await page.getByRole("tab", { name, exact: true }).click();
  await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  return page.getByRole("tabpanel", { name, exact: true });
};

for (const locale of ["en", "fr"]) {
  const french = locale === "fr";
  test(`restricted typed cron editing and previews in ${locale}`, async ({
    page,
  }) => {
    const demo = await visit(page, locale, "cron-expression-editor");
    const input = demo.getByRole("textbox", {
      name: french ? "Expression cron" : "Cron expression",
    });
    await input.fill("");
    await input.pressSequentially("*/15   9 * * 1-5");
    await expect(input).toHaveValue("*/15 9 * * 1-5");
    await input.press("a");
    await expect(input).toHaveValue("*/15 9 * * 1-5");
    await input.fill("61 9 * * 1-5");
    await expect(input).toHaveValue("*/15 9 * * 1-5");
    await input.fill("0 24 * * *");
    await expect(input).toHaveValue("*/15 9 * * 1-5");
    await expect(demo.getByRole("listitem")).toHaveCount(0);
    await demo
      .getByText(french ? "Prochaines exécutions" : "Next runs", {
        exact: true,
      })
      .click();
    await expect(demo.getByRole("listitem")).toHaveCount(5);
    await demo
      .getByRole("button", {
        name: french ? "Chaque jour à 9 h" : "Daily at 09:00",
      })
      .click();
    await expect(input).toHaveValue("0 9 * * *");
    await input.focus();
    await input.evaluate((element: HTMLInputElement) =>
      element.setSelectionRange(1, 1),
    );
    await input.press("/");
    await input.press("2");
    await expect(input).toHaveValue("0/2 9 * * *");
    await expect(input).toHaveAttribute("aria-invalid", "false");
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  });
  test(`numeric phone masking, deletion, paste and country search in ${locale}`, async ({
    page,
  }) => {
    const demo = await visit(page, locale, "phone-number-input");
    const input = demo.getByLabel(
      french ? "Numéro de téléphone" : "Phone number",
      { exact: true },
    );
    await input.fill("");
    await input.pressSequentially("416abc5550123");
    await expect(input).toHaveValue("(416) 555-0123");
    await expect(demo.getByText("+14165550123", { exact: true })).toBeVisible();
    await input.evaluate((element: HTMLInputElement) =>
      element.setSelectionRange(5, 5),
    );
    await input.press("Backspace");
    await expect
      .poll(async () => (await input.inputValue()).replace(/\D/g, ""))
      .toBe("415550123");
    await input.fill("");
    await input.press("Backspace");
    const country = demo.getByRole("combobox");
    await expect(country).toContainText("+1");
    await country.click();
    await page
      .getByPlaceholder(french ? "Rechercher..." : "Search...", { exact: true })
      .fill("France");
    await page.getByRole("option", { name: /France/ }).click();
    await expect(country).toContainText("+33");
    await input.pressSequentially("0612345678");
    await expect(input).toHaveValue("06 12 34 56 78");
    await expect(input).toHaveAttribute("aria-invalid", "false");
    await input.fill("+1 (416) 555-0123");
    await expect(country).toContainText("CA");
    await expect(country).toContainText("+1");
    await expect(input).toHaveValue("(416) 555-0123");
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  });
}
