import { expect, test, type Page } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3013";
const visit = async (page: Page, locale: string, slug: string) => {
  await page.goto(`${origin}/${locale}/docs/${slug}`);
  const code = page.getByRole("tab", { name: "Code", exact: true });
  await expect
    .poll(async () => {
      await code.click();
      return code.getAttribute("aria-selected");
    })
    .toBe("true");
  await page
    .getByRole("tab", {
      name: locale === "fr" ? "Aperçu" : "Preview",
      exact: true,
    })
    .first()
    .click();
  return page
    .getByRole("tabpanel", {
      name: locale === "fr" ? "Aperçu" : "Preview",
      exact: true,
    })
    .first();
};

test("subject and preview variables insert at the selection and respect length limits", async ({
  page,
}) => {
  const demo = await visit(page, "en", "email-editor");
  for (const label of ["Subject", "Preview text"]) {
    const input = demo.getByRole("textbox", { name: label, exact: true });
    const picker = demo
      .getByRole("group", { name: label, exact: true })
      .getByRole("button", {
        name: "Insert variable",
        exact: true,
      });
    await input.fill("Hello NAME!");
    await input.press("ControlOrMeta+A");
    await input.press("ArrowLeft");
    for (let index = 0; index < 6; index++) await input.press("ArrowRight");
    for (let index = 0; index < 4; index++)
      await input.press("Shift+ArrowRight");
    await picker.click();
    await page
      .getByRole("menuitem", { name: "First name", exact: true })
      .click();
    await expect(input.locator("[data-rich-variable=firstName]")).toHaveCount(
      1,
    );
    await expect(input).not.toContainText("NAME");
    await expect(input).toBeFocused();
    await picker.click();
    await page.getByRole("menuitem", { name: "App name", exact: true }).click();
    await expect(input.locator("[data-rich-variable=appName]")).toHaveCount(1);
    await input.press("Backspace");
    await expect(input.locator("[data-rich-variable=appName]")).toHaveCount(0);
    await input.press("ControlOrMeta+z");
    await expect(input.locator("[data-rich-variable=appName]")).toHaveCount(1);
    await input.fill("x".repeat(200));
    await picker.click();
    await page
      .getByRole("menuitem", { name: "First name", exact: true })
      .click();
    await expect(input).toHaveText("x".repeat(200));
    await input.press("Enter");
    await expect(input).toHaveText("x".repeat(200));
    await expect(input).toHaveAttribute("aria-multiline", "false");
  }
});

test("email toolbar inserts elements from the picker", async ({ page }) => {
  const demo = await visit(page, "en", "email-editor");
  const list = demo.getByRole("list", { name: "Email content", exact: true });
  const count = await list.getByRole("listitem").count();
  await demo.getByRole("button", { name: "Add element", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Divider", exact: true })
    .click();
  await expect(list.getByRole("listitem")).toHaveCount(count + 1);
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("a tall email element can be dragged past shorter elements to the bottom", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 2400 });
  const demo = await visit(page, "en", "email-editor");
  const list = demo.getByRole("list", { name: "Email content", exact: true });
  const heading = list
    .getByRole("listitem")
    .filter({ hasText: "A little code. A warm welcome." });
  const handle = heading.getByRole("button", {
    name: "Reorder: Text",
    exact: true,
  });
  await handle.scrollIntoViewIfNeeded();
  const start = await handle.boundingBox();
  const bounds = await list.boundingBox();
  if (!start || !bounds) throw new Error("Drag targets must have layout boxes");
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    start.x + start.width / 2,
    bounds.y + bounds.height - 2,
    { steps: 30 },
  );
  await expect(list.getByRole("listitem").last()).toContainText(
    "A little code. A warm welcome.",
  );
  await page.mouse.up();
  const bottom = await handle.boundingBox();
  if (!bottom) throw new Error("The moved handle must retain its layout box");
  await page.mouse.move(
    bottom.x + bottom.width / 2,
    bottom.y + bottom.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(bottom.x + bottom.width / 2, bounds.y + 2, {
    steps: 30,
  });
  await expect(list.getByRole("listitem").first()).toContainText(
    "A little code. A warm welcome.",
  );
  await page.mouse.up();
  const moved = await handle.boundingBox();
  if (!moved) throw new Error("The moved handle must remain available");
  await page.mouse.move(moved.x + moved.width / 2, moved.y + moved.height / 2);
  await page.mouse.down();
  await page.mouse.move(moved.x + moved.width / 2, bounds.y + 2, { steps: 30 });
  await expect(list.getByRole("listitem").first()).toContainText(
    "A little code. A warm welcome.",
  );
  await page.mouse.up();
});

test("clicking an email element surface selects its settings", async ({
  page,
}) => {
  const demo = await visit(page, "en", "email-editor");
  const list = demo.getByRole("list", { name: "Email content", exact: true });
  const properties = page.getByRole("dialog");
  await list.locator('[data-motion-key="logo"] img').click();
  await expect(
    properties.getByRole("heading", { name: "Logo", exact: true }),
  ).toBeVisible();
  await properties.getByRole("button", { name: "Close settings" }).click();
  await expect(properties).not.toBeVisible();
  await list.locator("hr").click();
  await expect(
    properties.getByRole("heading", { name: "Divider", exact: true }),
  ).toBeVisible();
  await properties
    .getByRole("combobox", { name: "Alignment", exact: true })
    .click();
  await page.getByRole("option", { name: "Right", exact: true }).click();
  await expect(
    properties.getByRole("combobox", { name: "Alignment", exact: true }),
  ).toContainText("Right");
  await page.keyboard.press("Escape");
  await expect(properties).not.toBeVisible();
});

test("email language picker preserves separate documents and uses language autonyms", async ({
  page,
}) => {
  const demo = await visit(page, "en", "email-editor");
  const language = demo.getByRole("combobox", { name: /Email language/ });
  await demo
    .getByRole("textbox", { name: "Subject", exact: true })
    .fill("English draft");
  await language.click();
  await expect(
    page.getByRole("option", { name: "English", exact: true }),
  ).toBeVisible();
  await page.getByRole("option", { name: "Français", exact: true }).click();
  await demo
    .getByRole("textbox", { name: "Objet", exact: true })
    .fill("Brouillon français");
  await language.click();
  await page.getByRole("option", { name: "English", exact: true }).click();
  await expect(
    demo.getByRole("textbox", { name: "Subject", exact: true }),
  ).toHaveText("English draft");
  await language.click();
  await page.getByRole("option", { name: "Français", exact: true }).click();
  await expect(
    demo.getByRole("textbox", { name: "Objet", exact: true }),
  ).toHaveText("Brouillon français");
});

test("email settings pickers update font, destination and code variable inside popovers", async ({
  page,
}) => {
  const demo = await visit(page, "en", "email-editor");
  await demo.getByRole("button", { name: "Branding", exact: true }).click();
  const branding = page.getByRole("dialog", { name: "Branding", exact: true });
  await branding.getByRole("combobox", { name: "Font", exact: true }).click();
  await page.getByRole("option", { name: "Serif", exact: true }).click();
  await expect(
    branding.getByRole("combobox", { name: "Font", exact: true }),
  ).toContainText("Serif");
  await page.keyboard.press("Escape");
  const list = demo.getByRole("list", { name: "Email content", exact: true });
  await list
    .locator('[data-motion-key="action"]')
    .getByRole("button", { name: "Edit element: Button", exact: true })
    .click();
  const settings = page.getByRole("dialog");
  await settings
    .getByRole("combobox", { name: "Destination", exact: true })
    .click();
  await page.getByRole("option", { name: "Custom URL", exact: true }).click();
  await expect(
    settings.getByRole("textbox", { name: "Custom URL", exact: true }),
  ).toBeVisible();
  await settings
    .getByRole("combobox", { name: "Destination", exact: true })
    .click();
  await page.getByRole("option", { name: "Account URL", exact: true }).click();
  await expect(
    settings.getByRole("textbox", { name: "Custom URL", exact: true }),
  ).toHaveCount(0);
  await settings
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await list
    .locator('[data-motion-key="code"]')
    .getByRole("button", {
      name: "Edit element: Verification code",
      exact: true,
    })
    .click();
  await settings
    .getByRole("combobox", { name: "Variable", exact: true })
    .click();
  await page.getByRole("option", { name: "First name", exact: true }).click();
  await expect(
    settings.getByRole("combobox", { name: "Variable", exact: true }),
  ).toContainText("First name");
  await expect(list.locator('[data-motion-key="code"]')).toContainText(
    "{{firstName}}",
  );
});

for (const locale of ["en", "fr"]) {
  const french = locale === "fr";
  test(`native rich text, atomic variables, paste and history in ${locale}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const demo = await visit(page, locale, "rich-text-editor");
    const editor = demo.getByRole("textbox", { name: "Message", exact: true });
    await editor.fill("Welcome Alex");
    await editor.press("ControlOrMeta+A");
    await demo
      .getByRole("button", { name: french ? "Gras" : "Bold", exact: true })
      .click();
    await expect(
      demo.getByRole("button", { name: french ? "Gras" : "Bold", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await editor.press("ArrowRight");
    await editor.pressSequentially("!");
    await expect(editor).toHaveText("Welcome Alex!");
    await demo
      .getByRole("button", {
        name: french ? "Insérer une variable" : "Insert variable",
        exact: true,
      })
      .click();
    await page
      .getByRole("menuitem", {
        name: french ? "Nom de l’application" : "App name",
        exact: true,
      })
      .click();
    await expect(editor).toContainText(
      french ? "{{Nom de l’application}}" : "{{App name}}",
    );
    await editor.press("Backspace");
    await expect(editor).not.toContainText("{{");
    await editor.press("ControlOrMeta+z");
    await expect(editor).toContainText("{{");
    await editor.press("ControlOrMeta+Shift+z");
    await expect(editor).not.toContainText("{{");
    await editor.evaluate((element) => {
      const clipboard = new DataTransfer();
      clipboard.setData("text/plain", "<img src=x onerror=alert(1)>");
      clipboard.setData("text/html", "<img src=x onerror=alert(1)>");
      element.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: clipboard,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await expect(editor).toContainText("<img src=x onerror=alert(1)>");
    await expect(editor.getByRole("img")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test(`block formatting preserves the selection through the styled picker in ${locale}`, async ({
    page,
  }) => {
    const demo = await visit(page, locale, "rich-text-editor");
    const editor = demo.getByRole("textbox", { name: "Message", exact: true });
    await editor.fill("Selected heading");
    await editor.press("ControlOrMeta+A");
    await demo
      .getByRole("combobox", {
        name: french ? "Paragraphe" : "Paragraph",
        exact: true,
      })
      .click();
    await page
      .getByRole("option", { name: french ? "Titre" : "Heading", exact: true })
      .click();
    await expect(
      editor.getByRole("heading", { name: "Selected heading" }),
    ).toBeVisible();
    await expect(editor).toBeFocused();
    await demo
      .getByRole("button", { name: french ? "Annuler" : "Undo", exact: true })
      .click();
    await expect(editor.getByRole("heading")).toHaveCount(0);
    await expect(editor).toHaveText("Selected heading");
  });

  test(`email element reordering and delivery preview in ${locale}`, async ({
    page,
  }) => {
    const demo = await visit(page, locale, "email-editor");
    const list = demo.getByRole("list", {
      name: french ? "Contenu du courriel" : "Email content",
      exact: true,
    });
    await expect(list.getByRole("listitem")).toHaveCount(7);
    const handle = list.getByRole("button", {
      name: french
        ? "Réordonner: Code de vérification"
        : "Reorder: Verification code",
      exact: true,
    });
    await handle.focus();
    await handle.press("Home");
    await expect(list.getByRole("listitem").first()).toContainText("{{code}}");
    await expect(handle).toBeFocused();
    await demo
      .getByRole("tab", { name: french ? "Aperçu" : "Preview", exact: true })
      .click();
    const frame = demo.frameLocator("iframe");
    await expect(frame.getByText("482 916", { exact: true })).toBeVisible();
    await expect(
      frame.getByText(french ? "Bonjour Alex," : "Hi Alex,", { exact: true }),
    ).toBeVisible();
    const body = await frame.locator("body").innerText();
    expect(body.indexOf("482 916")).toBeLessThan(
      body.indexOf(french ? "Un petit code" : "A little code"),
    );
    expect(body).not.toContain("{{");
  });

  test(`link removal belongs to the link panel in ${locale}`, async ({
    page,
  }) => {
    const demo = await visit(page, locale, "rich-text-editor");
    const editor = demo.getByRole("textbox", { name: "Message", exact: true });
    const linkButton = demo.getByRole("button", {
      name: french ? "Lien" : "Link",
      exact: true,
    });
    const remove = demo.getByRole("button", {
      name: french ? "Retirer le lien" : "Remove link",
      exact: true,
    });
    await editor.fill("Visit KrakStack");
    await editor.press("ControlOrMeta+A");
    await linkButton.click();
    await expect(remove).toHaveCount(0);
    await demo
      .getByRole("textbox", { name: french ? "URL du lien" : "Link URL" })
      .fill("https://krakstack.net");
    await demo
      .getByRole("button", {
        name: french ? "Appliquer le lien" : "Apply link",
        exact: true,
      })
      .click();
    await expect(
      editor.getByRole("link", { name: "Visit KrakStack" }),
    ).toHaveAttribute("href", "https://krakstack.net");
    await expect(remove).toHaveCount(0);
    await expect(editor).toBeFocused();
    await linkButton.click();
    await remove.click();
    await expect(editor.getByRole("link")).toHaveCount(0);
    await expect(editor).toHaveText("Visit KrakStack");
    await expect(editor).toBeFocused();
    await expect(remove).toHaveCount(0);
    await demo
      .getByRole("button", { name: french ? "Annuler" : "Undo", exact: true })
      .click();
    await expect(
      editor.getByRole("link", { name: "Visit KrakStack" }),
    ).toBeVisible();
  });
}
