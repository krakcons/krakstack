import { expect, test } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3003";

test("editing the registry search returns the results to the top", async ({
  page,
}) => {
  await page.goto(`${origin}/en/`);
  const trigger = page.getByRole("button", { name: "Search registry..." });
  const dialog = page.getByRole("dialog", { name: "Registry search" });
  const input = dialog.getByRole("combobox");
  const inputFrame = dialog.locator(
    '[data-slot="command-input-wrapper"] > div',
  );
  const results = dialog.getByRole("listbox");
  const clear = dialog.getByRole("button", { name: "Clear search" });
  const scrollTop = () => results.evaluate((list) => list.scrollTop);

  // The server-rendered trigger can be visible before it is interactive.
  await expect(async () => {
    if (!(await dialog.isVisible())) await trigger.click();
    await expect(dialog).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 5000 });

  await expect(input).toBeFocused();
  await expect(clear).toBeHidden();
  await input.press("End");
  await expect.poll(scrollTop).toBeGreaterThan(0);

  await input.press("a");
  await expect(input).toHaveValue("a");
  await expect.poll(scrollTop).toBe(0);

  await expect
    .poll(async () => {
      const [field, button] = await Promise.all([
        inputFrame.boundingBox(),
        clear.boundingBox(),
      ]);
      if (!field || !button) return false;
      const fieldCenter = field.y + field.height / 2;
      const buttonCenter = button.y + button.height / 2;
      return (
        Math.abs(fieldCenter - buttonCenter) < 1 &&
        button.x > field.x &&
        button.x + button.width < field.x + field.width &&
        button.y > field.y &&
        button.y + button.height < field.y + field.height
      );
    })
    .toBe(true);
  await input.press("End");
  await expect.poll(scrollTop).toBeGreaterThan(0);
  await clear.click();
  await expect(dialog).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect.poll(scrollTop).toBe(0);

  await input.fill("picker");
  await clear.press("Enter");
  await expect(dialog).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await input.press("Escape");
  await expect(dialog).toBeHidden();
});

test("documentation search keeps the first match selected as results change", async ({
  page,
}) => {
  await page.goto(`${origin}/en/docs/search-menu`);
  const trigger = page
    .getByRole("button", { name: "Search documentation...", exact: true })
    .filter({ visible: true });
  const dialog = page.getByRole("dialog", { name: "Search documentation" });
  const input = dialog.getByRole("combobox");
  const options = dialog.getByRole("option");

  await expect(async () => {
    if (!(await dialog.isVisible())) await trigger.click();
    await expect(dialog).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 5000 });

  await input.press("F");
  await expect(options.first()).toContainText("File Picker");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
  await input.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");

  await input.press("i");
  await expect(input).toHaveValue("Fi");
  await expect(options.first()).toContainText("File Picker");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
});
