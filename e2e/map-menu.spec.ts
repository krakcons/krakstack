import { expect, test } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

for (const locale of ["en", "fr"]) {
  for (const theme of ["light", "dark"]) {
    for (const [width, height] of [
      [320, 740],
      [390, 844],
      [740, 390],
      [1440, 900],
    ]) {
      test(`map menu modes and drafts in ${locale}, ${theme}, ${width}x${height}`, async ({
        page,
      }, testInfo) => {
        await page.route("**/maps.googleapis.com/**", (route) => route.abort());
        await page.addInitScript(() => {
          class MapView {
            zoom = 8;
            constructor(element: HTMLElement) {
              element.style.background = "#e4e8e3";
            }
            getZoom = () => this.zoom;
            setZoom = (zoom: number) => {
              this.zoom = zoom;
            };
            setCenter = () => undefined;
            setOptions = () => undefined;
            fitBounds = () => undefined;
          }
          class Overlay {
            setMap = () => undefined;
            setPosition = () => undefined;
            setIcon = () => undefined;
            setCenter = () => undefined;
            setOptions = () => undefined;
            setRadius = () => undefined;
            getBounds = () => ({
              toJSON: () => ({ north: 44, south: 43, east: -79, west: -80 }),
            });
          }
          Object.assign(window, {
            google: {
              maps: {
                Map: MapView,
                Marker: Overlay,
                Circle: Overlay,
                event: {
                  addListener: () => ({ remove: () => undefined }),
                  clearInstanceListeners: () => undefined,
                },
              },
            },
          });
        });
        await page.setViewportSize({
          width: width ?? 390,
          height: height ?? 844,
        });
        await page.goto(`${origin}/${locale}/docs/map-menu`);
        await page.evaluate(
          (dark) => document.documentElement.classList.toggle("dark", dark),
          theme === "dark",
        );
        const example = page.locator('[data-example="map-menu"]');
        await example.locator('input[type="password"]').fill("map-test-key");
        const open = () =>
          example
            .getByRole("button", {
              name: locale === "fr" ? "Choisir un lieu" : "Choose a location",
              exact: true,
            })
            .click();
        await open();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        const input = dialog.getByRole("combobox", {
          name: locale === "fr" ? "Ville ou adresse" : "City or address",
          exact: true,
        });
        await expect(input).toHaveCSS("height", "50px");
        await expect(dialog.locator('[data-slot="map-menu-current"]')).toHaveCSS("height", "50px");
        const bounds = await dialog.boundingBox();
        expect(bounds?.width).toBeLessThanOrEqual(840);
        expect(bounds?.y).toBeGreaterThanOrEqual(-1);
        expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual((height ?? 900) + 1);
        const action = dialog.locator('[data-slot="map-menu-confirm"]');
        await expect(action).toHaveCSS("background-color", "oklch(0.9247 0.0524 66.1732)");
        await expect(dialog.locator('[data-slot="dialog-footer"]')).toHaveCSS(
          "border-top-width",
          "0px",
        );
        await expect(dialog.locator('[data-slot="dialog-footer"]')).toHaveCSS(
          "background-color",
          "rgba(0, 0, 0, 0)",
        );
        const radius = dialog.getByRole("combobox", {
          name: locale === "fr" ? "Rechercher dans un rayon de" : "Search within",
          exact: true,
        });
        await expect(radius.locator("option")).toHaveCount(11);
        const originalY = (await radius.boundingBox())?.y;
        await input.fill("Cal");
        const suggestions = dialog.getByRole("listbox");
        await expect(suggestions).toBeVisible();
        await expect(suggestions).toHaveCSS("position", "absolute");
        expect((await radius.boundingBox())?.y).toBe(originalY);
        await input.press("ArrowDown");
        await input.press("Enter");
        await expect(input).toHaveValue("Calgary, Alberta, Canada");
        await expect(dialog.locator('[data-slot="map-menu-provenance"]')).toHaveCount(0);
        await radius.selectOption("2");
        await dialog
          .getByRole("button", {
            name: locale === "fr" ? "Annuler" : "Cancel",
            exact: true,
          })
          .click();
        await expect(dialog).toHaveCount(0);
        await open();
        await expect(input).toHaveValue("Toronto, Ontario, Canada");
        await expect(radius).toHaveValue("100");
        const canvas = dialog.locator('[data-slot="map-menu-canvas"]');
        await canvas.scrollIntoViewIfNeeded();
        const mapBounds = await canvas.boundingBox();
        const footerBounds = await dialog.locator('[data-slot="dialog-footer"]').boundingBox();
        expect(mapBounds?.height).toBeGreaterThanOrEqual(180);
        expect((mapBounds?.y ?? 0) + (mapBounds?.height ?? 0)).toBeLessThanOrEqual(
          (footerBounds?.y ?? 0) + 1,
        );
        if (width === 390 || width === 1440)
          await page.screenshot({
            path: testInfo.outputPath(`picker-${width}.png`),
            fullPage: false,
          });
        await radius.selectOption("2");
        await action.click();
        await expect(dialog).toHaveCount(0);
        await expect(example.getByRole("status")).toContainText("2 km");
        await example
          .getByRole("button", {
            name: locale === "fr" ? "Choisir une épingle" : "Choose a pinpoint",
            exact: true,
          })
          .click();
        await expect(dialog).toBeVisible();
        await expect(radius).toHaveCount(0);
        await expect(dialog.getByRole("combobox")).toHaveCount(1);
        await expect(input).toHaveValue("Toronto, Ontario, Canada");
        await input.fill("Cal");
        await expect(dialog.getByRole("listbox")).toBeVisible();
        await input.press("ArrowDown");
        await input.press("Enter");
        await expect(input).toHaveValue("Calgary, Alberta, Canada");
        await expect(
          dialog.getByRole("button", {
            name: locale === "fr" ? "Afficher la zone sélectionnée" : "Show selected area",
          }),
        ).toHaveCount(0);
        await dialog
          .getByRole("button", {
            name: locale === "fr" ? "Utiliser ce lieu" : "Use this location",
            exact: true,
          })
          .click();
        await expect(dialog).toHaveCount(0);
        await expect(example.getByRole("status")).toContainText("Calgary");
        await expect(example.getByRole("status")).not.toContainText("km");
      });
    }
  }
}
