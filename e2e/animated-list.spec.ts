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
      // SSR tabs can be visible before hydration installs their handlers.
      await expect
        .poll(async () => {
          await code.click();
          return code.getAttribute("aria-selected");
        })
        .toBe("true");
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

test.describe("touch reordering", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 900 } });

  test("keeps dragging across keyed moves and releases a cancelled touch", async ({
    page,
  }) => {
    await page.goto(`${origin}/en/docs/animated-list`);
    const code = page.getByRole("tab", { name: "Code", exact: true });
    await expect
      .poll(async () => {
        await code.click();
        return code.getAttribute("aria-selected");
      })
      .toBe("true");
    await page.getByRole("tab", { name: "Preview", exact: true }).click();
    const demo = page.getByRole("tabpanel", { name: "Preview", exact: true });
    const list = demo.getByRole("list");
    const handle = list.getByRole("button", {
      name: "Reorder: Item 1",
      exact: true,
    });
    await handle.scrollIntoViewIfNeeded();
    const start = await handle.boundingBox();
    const target = await list.getByRole("listitem").last().boundingBox();
    if (!start || !target)
      throw new Error("Touch targets must have layout boxes");
    const x = start.x + start.width / 2;
    const y = start.y + start.height / 2;
    const destination = target.y + target.height * 0.75;
    const touch = await page.context().newCDPSession(page);
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let step = 1; step <= 12; step++) {
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y + ((destination - y) * step) / 12 }],
      });
    }
    await expect(list.getByRole("listitem").last()).toContainText("Item 1");
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchCancel",
      touchPoints: [],
    });
    await expect(list.locator("[data-dragging]")).toHaveCount(0);
    await handle.focus();
    await handle.press("Home");
    await expect(list.getByRole("listitem").first()).toContainText("Item 1");
    await expect(handle).toBeFocused();
    await touch.detach();
  });
});
