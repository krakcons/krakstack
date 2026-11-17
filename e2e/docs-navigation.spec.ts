import { expect, test } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3023";

// This regression covers the production build, not Vite's on-demand MDX path.
test.skip(
  !process.env.PLAYWRIGHT_PRODUCTION,
  "Requires a production build/server",
);

for (const locale of ["en", "fr"]) {
  test(`${locale}: docs navigate with static chunks, no document reload or server function`, async ({
    page,
  }) => {
    const serverFunctions: string[] = [];
    await page.route("**/_serverFn/**", async (route) => {
      serverFunctions.push(route.request().url());
      await route.abort();
    });
    const response = await page.goto(`${origin}/${locale}/docs/time-picker`);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["cache-control"]).toBe("no-cache");

    // Confirm hydration through a real interaction before testing navigation.
    const code = page.getByRole("tab", { name: "Code", exact: true });
    await code.click();
    await expect(code).toHaveAttribute("aria-selected", "true");
    const documents: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "document") documents.push(request.url());
    });

    await page
      .getByRole("link", { name: "Loading", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(`${origin}/${locale}/docs/loading`);
    await expect(
      page.getByRole("heading", { name: "Loading", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Copy Button", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Copy Button", exact: true }),
    ).toBeVisible();

    await page.goBack();
    await expect(
      page.getByRole("heading", { name: "Loading", exact: true }),
    ).toBeVisible();
    await page.goForward();
    await expect(
      page.getByRole("heading", { name: "Copy Button", exact: true }),
    ).toBeVisible();
    expect(documents).toEqual([]);
    expect(serverFunctions).toEqual([]);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
  });
}
