import { expect, test } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3023";

for (const locale of ["en", "fr"]) {
  const french = locale === "fr";
  test.describe(locale, () => {
    test.use({
      viewport: { width: french ? 320 : 1280, height: 900 },
      timezoneId: french ? "Pacific/Kiritimati" : "America/Los_Angeles",
    });

    test("scrolling columns support 12/24-hour entry, keyboard focus and bounds", async ({
      page,
    }) => {
      await page.goto(`${origin}/${locale}/docs/time-picker`);
      const codeTab = page.getByRole("tab", { name: "Code", exact: true });
      // The docs shell can rehydrate after its locale-specific date is rendered.
      // Wait for an observable interaction before editing the controlled preview.
      await expect
        .poll(async () => {
          await codeTab.click();
          return codeTab.getAttribute("aria-selected");
        })
        .toBe("true");
      const preview = french ? "Aperçu" : "Preview";
      const previewTab = page.getByRole("tab", { name: preview, exact: true });
      await previewTab.click();
      await expect(previewTab).toHaveAttribute("aria-selected", "true");
      const demo = page.getByRole("tabpanel");
      const input = demo.getByRole("textbox", {
        name: french ? "Heure souhaitée" : "Preferred time",
      });
      const trigger = demo.getByRole("button", {
        name: french ? "Ouvrir le sélecteur d’heure" : "Open time picker",
      });
      await input.fill("04:45 PM");
      await trigger.focus();
      await trigger.press("Enter");
      const hours = page.getByRole("radiogroup", {
        name: french ? "Heures" : "Hours",
        exact: true,
      });
      const minutes = page.getByRole("radiogroup", {
        name: "Minutes",
        exact: true,
      });
      await expect(
        hours.getByRole("radio", { name: "4", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(input).toHaveValue("5:30 PM");
      await minutes.getByRole("radio", { name: "23", exact: true }).click();
      await expect(input).toHaveValue("5:23 PM");
      await minutes.getByRole("radio", { name: "29", exact: true }).focus();
      await page.keyboard.press("ArrowRight");
      await expect(input).toHaveValue("5:30 PM");
      await expect(
        minutes.getByRole("radio", { name: "30", exact: true }),
      ).toBeFocused();
      await expect(
        minutes.getByRole("radio", { name: "45", exact: true }),
      ).toHaveCount(0);
      await page.keyboard.press("Home");
      await expect(input).toHaveValue("5:00 PM");
      await expect(
        minutes.getByRole("radio", { name: "00", exact: true }),
      ).toBeFocused();
      const period = page.getByRole("radiogroup", {
        name: "AM/PM",
        exact: true,
      });
      await period.getByRole("radio", { name: "AM", exact: true }).click();
      await expect(input).toHaveValue("9:00 AM");
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await demo
        .getByRole("button", {
          name: french ? "Format 24 heures" : "24-hour format",
        })
        .click();
      await expect(input).toHaveValue("09:00");
      await trigger.click();
      await expect(period).toHaveCount(0);
      await hours.getByRole("radio", { name: "09", exact: true }).press("End");
      await expect(input).toHaveValue("17:00");
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await expect(hours).toHaveCount(0);
      await trigger.click();
      const dialog = page.getByRole("dialog");
      const bounds = await dialog.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
        page.viewportSize()!.width,
      );
      await page
        .getByRole("button", {
          name: french ? "Terminer" : "Done",
          exact: true,
        })
        .click();
      await expect(trigger).toBeFocused();
    });
  });
}
