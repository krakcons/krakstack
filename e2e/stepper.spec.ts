import { expect, test } from "@playwright/test";

// Run against a built KrakStack site; no authentication or database is needed.
const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3010";

for (const locale of ["en", "fr"]) {
  for (const width of [1280, 320]) {
    test(`stepper navigation and focus in ${locale} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${origin}/${locale}/docs/stepper`);
      const example = page.locator('[data-example="compact-stepper"]');
      const content = example.locator('[data-slot="stepper-content"]');
      await expect(content).toBeVisible();
      const previous = example.getByRole("button", {
        name: locale === "fr" ? "Précédent" : "Previous",
        exact: true,
      });
      await expect(previous).toHaveCount(0);
      await expect(example.locator('[data-slot="stepper"]')).toHaveCount(1);
      await expect(example.locator('[data-slot="stepper"]')).toHaveAttribute(
        "data-variant",
        "underline",
      );
      await example
        .getByRole("button", {
          name: locale === "fr" ? "Continuer" : "Continue",
          exact: true,
        })
        .click();
      await expect(content.getByRole("heading")).toHaveText(
        locale === "fr" ? "Configuration" : "Configure",
      );
      await expect(content.getByRole("heading")).toBeFocused();
      await expect(previous).toBeVisible();
      await example
        .getByRole("button", {
          name: locale === "fr" ? "Précédent" : "Previous",
          exact: true,
        })
        .click();
      await expect(content.getByRole("heading")).toHaveText(
        locale === "fr" ? "Connexion" : "Connect",
      );
      await expect(previous).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
      ).toBe(false);

      await page.emulateMedia({ reducedMotion: "reduce" });
      await example
        .getByRole("button", {
          name: locale === "fr" ? "Vérification" : "Verify",
          exact: true,
        })
        .click();
      await expect(content.getByRole("heading")).toHaveText(
        locale === "fr" ? "Vérification" : "Verify",
      );
      expect(
        await content.evaluate(
          (element) => element.getAnimations({ subtree: true }).length,
        ),
      ).toBe(0);
    });

    test(`stepper form validation and draft in ${locale} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${origin}/${locale}/docs/stepper`);
      const example = page.locator('[data-example="form-stepper"]');
      const field = example.getByRole("textbox");
      const content = example.locator('[data-slot="stepper-content"]');
      const next = example.getByRole("button", {
        name: locale === "fr" ? "Continuer" : "Continue",
        exact: true,
      });
      await expect(next).toBeEnabled();
      await next.click();
      await expect(field).toBeVisible();
      expect(
        await field.evaluate(
          (element: HTMLInputElement) => element.validity.valueMissing,
        ),
      ).toBe(true);
      const review = example.locator("nav button").nth(1);
      await expect(review).toHaveAttribute("aria-disabled", "true");
      await review.focus();
      await page.keyboard.press("Enter");
      await expect(field).toBeVisible();
      await field.fill("Demo project");
      await next.click();
      await expect(content.getByRole("definition")).toHaveText("Demo project");
      await example
        .getByRole("button", {
          name: locale === "fr" ? "Précédent" : "Previous",
          exact: true,
        })
        .click();
      await expect(field).toHaveValue("Demo project");
      await field.fill("Revised project");
      await next.click();
      await example
        .getByRole("button", {
          name: locale === "fr" ? "Confirmer" : "Confirm",
          exact: true,
        })
        .click();
      await expect(content.getByRole("heading")).toHaveText(
        locale === "fr" ? "Terminé" : "Done",
      );
      await example
        .getByRole("button", {
          name: locale === "fr" ? "Précédent" : "Previous",
          exact: true,
        })
        .click();
      await expect(content.getByRole("definition")).toHaveText(
        "Revised project",
      );
    });
  }
}
