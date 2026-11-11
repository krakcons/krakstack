import { expect, test, type Page } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3023";
const visit = async (page: Page, locale: string, slug: string) => {
  await page.goto(`${origin}/${locale}/docs/${slug}`);
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  const name = locale === "fr" ? "Aperçu" : "Preview";
  await page.getByRole("tab", { name, exact: true }).click();
  return page.getByRole("tabpanel", { name, exact: true });
};

for (const locale of ["en", "fr"]) {
  const french = locale === "fr";
  test.describe(locale, () => {
    test.use({
      viewport: { width: french ? 320 : 1280, height: 900 },
      timezoneId: french ? "Pacific/Kiritimati" : "America/Los_Angeles",
    });

    test("Other reveals a focused field and switching options removes stale text", async ({
      page,
    }) => {
      const demo = await visit(page, locale, "select-with-custom-input");
      const select = demo.getByRole("combobox");
      await expect(demo.getByRole("textbox")).toHaveCount(0);
      await select.click();
      await page
        .getByRole("option", {
          name: french ? "Autre (préciser)" : "Other (self-describe)",
          exact: true,
        })
        .click();
      const input = demo.getByRole("textbox", {
        name: french ? "Décrivez votre genre" : "Describe your gender",
        exact: true,
      });
      await expect(input).toBeFocused();
      await input.fill("My own words");
      await select.click();
      await page
        .getByRole("option", {
          name: french ? "Je préfère ne pas répondre" : "Prefer not to say",
          exact: true,
        })
        .click();
      await expect(input).toHaveCount(0);
      await select.click();
      await page
        .getByRole("option", {
          name: french ? "Autre (préciser)" : "Other (self-describe)",
          exact: true,
        })
        .click();
      await expect(input).toHaveValue("");
      await select.focus();
      await select.press("ArrowDown");
      await page.keyboard.press("Home");
      await page.keyboard.press("Enter");
      await expect(select).toContainText(french ? "Femme" : "Woman");
      await expect(input).toHaveCount(0);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    });

    test("calendar selection stays date-only across time zones, with keyboard access and typed validation", async ({
      page,
    }) => {
      const demo = await visit(page, locale, "date-picker");
      const input = demo.getByRole("textbox", {
        name: french ? "Date souhaitée" : "Preferred date",
        exact: true,
      });
      const trigger = demo.getByRole("button", {
        name: french ? "Ouvrir le calendrier" : "Open calendar",
        exact: true,
      });
      await expect(input).toHaveValue("2026-11-11");
      await trigger.click();
      const day = page.getByRole("button", {
        name: french
          ? "jeudi 12 novembre 2026"
          : "Thursday, November 12th, 2026",
        exact: true,
      });
      await day.click();
      await expect(input).toHaveValue("2026-11-12");
      await expect(trigger).toBeFocused();
      await trigger.click();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Enter");
      await expect(input).toHaveValue("2026-11-13");
      await input.fill("2026-01-01");
      await trigger.click();
      await expect(
        page.getByRole("button", {
          name: french ? "Aller au mois précédent" : "Go to the Previous Month",
          exact: true,
        }),
      ).toBeDisabled();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await expect(input).toHaveValue("2026-01-01");
      await input.fill("2026-02-29");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(input).toHaveValue("2026-02-29");
      await expect
        .poll(() =>
          input.evaluate((element: HTMLInputElement) => element.validity.valid),
        )
        .toBe(false);
      await input.fill("2026-02-28");
      await expect(input).toHaveAttribute("aria-invalid", "false");
      await input.fill("2028-01-01");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await demo
        .getByRole("button", {
          name: french ? "Effacer la date" : "Clear date",
          exact: true,
        })
        .click();
      await expect(input).toHaveValue("");
      await expect(input).toHaveAttribute("aria-invalid", "false");
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    });
  });
}
