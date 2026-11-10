import { expect, test } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3010";

for (const locale of ["en", "fr"]) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`animated list pointer and keyboard reordering in ${locale} with ${reducedMotion}`, async ({
      page,
    }) => {
      const french = locale === "fr";
      await page.emulateMedia({ reducedMotion });
      await page.setViewportSize({
        width: reducedMotion === "reduce" ? 320 : 1280,
        height: 1200,
      });
      await page.goto(`${origin}/${locale}/docs/animated-list`);
      const code = page.getByRole("tab", { name: "Code", exact: true });
      await code.click();
      await expect(code).toHaveAttribute("aria-selected", "true");
      await page
        .getByRole("tab", { name: french ? "Aperçu" : "Preview", exact: true })
        .click();
      const demo = page.getByRole("tabpanel", {
        name: french ? "Aperçu" : "Preview",
        exact: true,
      });
      const list = demo.getByRole("list");
      const itemName = french ? "Élément 1" : "Item 1";
      const handle = list.getByRole("button", {
        name: `${french ? "Réordonner" : "Reorder"}: ${itemName}`,
        exact: true,
      });
      await handle.scrollIntoViewIfNeeded();
      const start = await handle.boundingBox();
      const destination = await list.getByRole("listitem").last().boundingBox();
      if (!start || !destination)
        throw new Error("Reorder targets must have layout boxes");
      await page.mouse.move(
        start.x + start.width / 2,
        start.y + start.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        start.x + start.width / 2,
        destination.y + destination.height * 0.75,
        { steps: 20 },
      );
      await expect(list.getByRole("listitem").last()).toContainText(itemName);
      const bounds = await list.boundingBox();
      if (!bounds) throw new Error("The list must have a layout box");
      await page.mouse.move(
        start.x + start.width / 2 + 300,
        bounds.y + bounds.height + 200,
        { steps: 10 },
      );
      await expect
        .poll(() =>
          handle.evaluate((element) => {
            const item = element.closest("li");
            const list = item?.closest("ul");
            if (!item || !list) return Infinity;
            return (
              item.getBoundingClientRect().bottom -
              list.getBoundingClientRect().bottom
            );
          }),
        )
        .toBeLessThanOrEqual(12.5);
      const horizontal = await handle.evaluate((element) => {
        const item = element.closest("li")?.getBoundingClientRect();
        const list = element.closest("ul")?.getBoundingClientRect();
        return item && list
          ? item.left >= list.left - 0.5 && item.right <= list.right + 0.5
          : false;
      });
      expect(horizontal).toBe(true);
      await page.mouse.up();
      await expect(demo.getByRole("status")).toHaveText(
        `${itemName}, position 3 ${french ? "sur" : "of"} 3.`,
      );
      await handle.focus();
      await handle.press("ArrowUp");
      await expect(list.getByRole("listitem").nth(1)).toContainText(itemName);
      await expect(handle).toBeFocused();
      await handle.press("Home");
      await expect(list.getByRole("listitem").first()).toContainText(itemName);
      await handle.press("End");
      await expect(list.getByRole("listitem").last()).toContainText(itemName);
      await expect(handle).toBeFocused();
      await expect(demo.getByRole("status")).toHaveText(
        `${itemName}, position 3 ${french ? "sur" : "of"} 3.`,
      );
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
    });
  }
}
