import { expect, test, type Page } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3010";

const expectSeparatedRows = async (page: Page) => {
  const options = page.getByRole("listbox").getByRole("option");
  await expect.poll(() => options.count()).toBeGreaterThan(3);
  await expect
    .poll(() =>
      options.evaluateAll((elements) => {
        const rows = elements
          .map((element) => ({
            label: element.textContent?.slice(0, 60),
            row: element.getBoundingClientRect(),
            content: element.firstElementChild?.getBoundingClientRect(),
          }))
          .sort((a, b) => a.row.top - b.row.top);
        return rows.flatMap((entry, index) => {
          const issues: string[] = [];
          if (
            !entry.content ||
            entry.content.top < entry.row.top - 0.5 ||
            entry.content.bottom > entry.row.bottom + 0.5
          )
            issues.push(`Content exceeds row: ${entry.label}`);
          const next = rows[index + 1];
          if (
            next?.content &&
            entry.content &&
            entry.content.bottom > next.content.top + 0.5
          )
            issues.push(`Adjacent rows overlap: ${entry.label}`);
          return issues;
        });
      }),
    )
    .toEqual([]);
};

for (const locale of ["en", "fr"]) {
  for (const width of [320, 1280]) {
    test(`timezone dropdown rows do not overlap in ${locale} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${origin}/${locale}/docs/timezone-select`);
      await page.getByRole("tab", { name: "Code", exact: true }).click();
      await page
        .getByRole("tab", {
          name: locale === "fr" ? "Aperçu" : "Preview",
          exact: true,
        })
        .click();
      await page
        .getByRole("combobox", {
          name:
            locale === "fr" ? "Fuseau horaire préféré" : "Preferred time zone",
          exact: true,
        })
        .click();
      const list = page.getByRole("listbox");
      await expect(list).toBeVisible();
      await expectSeparatedRows(page);
      await list.evaluate((element) => {
        element.scrollTop = 0;
      });
      await expectSeparatedRows(page);
      await list.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await expectSeparatedRows(page);
      await page.setViewportSize({
        width: width === 320 ? 1280 : 320,
        height: 1000,
      });
      await expectSeparatedRows(page);
    });
  }
}
