import { expect, test, type Page } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3010";

const visitExample = async (page: Page, locale: string, slug: string) => {
  await page.goto(`${origin}/${locale}/docs/${slug}`);
  // Exercise a hydrated control before editing server-rendered inputs.
  const code = page.getByRole("tab", { name: "Code", exact: true });
  await code.click();
  await expect(code).toHaveAttribute("aria-selected", "true");
  const preview = page.getByRole("tab", {
    name: locale === "fr" ? "Aperçu" : "Preview",
    exact: true,
  });
  await preview.click();
  await expect(preview).toHaveAttribute("aria-selected", "true");
  return page.getByRole("tabpanel", {
    name: locale === "fr" ? "Aperçu" : "Preview",
    exact: true,
  });
};

for (const locale of ["en", "fr"]) {
  const french = locale === "fr";
  test(`async actions, editable drafts and typed confirmation in ${locale}`, async ({
    page,
  }) => {
    let demo = await visitExample(page, locale, "async-action-button");
    await demo.getByRole("checkbox").check();
    await demo
      .getByRole("button", {
        name: french ? "Lancer l’action d’exemple" : "Run example action",
        exact: true,
      })
      .click();
    const retry = demo.getByRole("button", {
      name: french ? "Réessayer" : "Try again",
      exact: true,
    });
    await expect(retry).toBeVisible();
    await demo.getByRole("checkbox").uncheck();
    await retry.click();
    await expect(
      demo.getByRole("button", {
        name: french ? "Terminé" : "Completed",
        exact: true,
      }),
    ).toBeVisible();

    demo = await visitExample(page, locale, "editable-text");
    await demo.getByRole("checkbox").check();
    await demo
      .getByRole("button", {
        name: french ? "Modifier Nom du projet" : "Edit Project name",
        exact: true,
      })
      .click();
    const draft = demo.getByRole("textbox");
    await expect(draft).toBeFocused();
    await draft.fill("Updated project");
    await draft.press("Enter");
    await expect(demo.getByRole("status")).toContainText(
      french ? "Impossible" : "Could not save",
    );
    await expect(draft).toHaveValue("Updated project");
    await demo.getByRole("checkbox").uncheck();
    await draft.press("Enter");
    await expect(demo.getByRole("textbox")).toHaveCount(0);
    await expect(demo.getByRole("button")).toHaveText("Updated project");
    await expect(demo.getByRole("button")).toBeFocused();

    demo = await visitExample(page, locale, "danger-confirmation");
    const trigger = demo.getByRole("button");
    await trigger.click();
    const dialog = page.getByRole("alertdialog");
    const confirm = dialog.getByRole("button", {
      name: french ? "Confirmer la suppression" : "Confirm deletion",
      exact: true,
    });
    await expect(confirm).toBeDisabled();
    await dialog.getByRole("textbox").fill("DELETE ");
    await expect(confirm).toBeDisabled();
    await dialog.getByRole("textbox").fill("DELETE");
    await confirm.click();
    await expect(
      dialog.getByRole("button", {
        name: french ? "Annuler" : "Cancel",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(dialog.getByRole("textbox")).toHaveValue("");
    await dialog
      .getByRole("button", { name: french ? "Annuler" : "Cancel", exact: true })
      .click();
    await expect(dialog).toBeHidden();
  });

  test(`dirty navigation and native close protection in ${locale}`, async ({
    page,
  }) => {
    const demo = await visitExample(page, locale, "unsaved-changes-guard");
    await demo.getByRole("textbox").fill("Unsaved draft");
    await demo.getByRole("link").click({ noWaitAfter: true });
    const dialog = page.getByRole("alertdialog");
    await dialog
      .getByRole("button", {
        name: french ? "Continuer la modification" : "Keep editing",
        exact: true,
      })
      .click();
    await expect(dialog).toBeHidden();
    await expect(demo.getByRole("textbox")).toHaveValue("Unsaved draft");
    await demo.getByRole("link").click({ noWaitAfter: true });
    await dialog
      .getByRole("button", {
        name: french ? "Quitter la page" : "Leave page",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/\/docs$/);

    const freshDemo = await visitExample(page, locale, "unsaved-changes-guard");
    await freshDemo.getByRole("textbox").fill("Unsaved draft");
    const nativePrompt = page.waitForEvent("dialog");
    await page.close({ runBeforeUnload: true });
    const prompt = await nativePrompt;
    expect(prompt.type()).toBe("beforeunload");
    await prompt.dismiss();
    expect(page.isClosed()).toBe(false);
    await expect(freshDemo.getByRole("textbox")).toHaveValue("Unsaved draft");
  });

  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`motion outcomes in ${locale} with ${reducedMotion}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion });
      await page.setViewportSize({ width: 320, height: 900 });
      let demo = await visitExample(page, locale, "presence-transition");
      const toggle = demo.getByRole("button");
      await toggle.click();
      await expect(
        demo.locator('[data-slot="presence-transition"]'),
      ).toHaveCount(0);
      await toggle.click();
      await expect(
        demo.locator('[data-slot="presence-transition"]'),
      ).toBeVisible();
      await expect(toggle).toBeFocused();

      demo = await visitExample(page, locale, "auto-height");
      const container = demo.locator('[data-slot="auto-height"]');
      await expect
        .poll(() =>
          container.evaluate((element) => {
            const inner = element.firstElementChild;
            return Math.abs(
              element.getBoundingClientRect().height -
                (inner?.getBoundingClientRect().height ?? 0) -
                2,
            );
          }),
        )
        .toBeLessThan(1);
      const initialHeight = await container.evaluate(
        (element) => element.getBoundingClientRect().height,
      );
      await demo.getByRole("button").click();
      await expect
        .poll(() =>
          container.evaluate(
            (element) => element.getBoundingClientRect().height,
          ),
        )
        .toBeGreaterThan(initialHeight + 50);
      await demo.getByRole("button").click();
      await expect
        .poll(() =>
          container.evaluate(
            (element) => element.getBoundingClientRect().height,
          ),
        )
        .toBeLessThan(initialHeight + 2);

      demo = await visitExample(page, locale, "animated-list");
      const list = demo.getByRole("list");
      await expect(list.getByRole("listitem")).toHaveCount(3);

      await demo
        .getByRole("button", {
          name: french ? "Ajouter un élément" : "Add item",
          exact: true,
        })
        .click();
      await expect(list.getByRole("listitem")).toHaveCount(4);
      await demo
        .getByRole("button", {
          name: french ? "Inverser l’ordre" : "Reverse order",
          exact: true,
        })
        .click();
      await expect(list.getByRole("listitem").first()).toContainText(
        french ? "Élément 4" : "Item 4",
      );
      // Focus a retained control before removing another item.
      await demo
        .getByRole("button", {
          name: french ? "Ajouter un élément" : "Add item",
          exact: true,
        })
        .focus();
      await list
        .getByRole("button", {
          name: french ? "Retirer l’élément 4" : "Remove item 4",
          exact: true,
        })
        .click();
      await expect(list.getByRole("listitem")).toHaveCount(3);
      await expect(
        demo.getByRole("button", {
          name: french ? "Ajouter un élément" : "Add item",
          exact: true,
        }),
      ).toBeFocused();

      demo = await visitExample(page, locale, "animated-number");
      await demo
        .getByRole("button", {
          name: french ? "Augmenter le total" : "Increase total",
          exact: true,
        })
        .click();
      const number = demo.locator('[data-slot="animated-number"]');
      const target = await page.evaluate(
        (lang) =>
          new Intl.NumberFormat(lang, {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          }).format(1500),
        locale,
      );
      await expect(number.locator('[aria-hidden="true"]')).toHaveText(target);
      await expect(number.locator(".sr-only")).toHaveText(target);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(320);
    });
  }
}
