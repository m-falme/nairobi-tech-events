import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "";

test.beforeEach(async ({ context, baseURL }) => {
  const appOrigin = new URL(baseURL!).origin;
  await context.route(
    (url) => url.origin !== appOrigin,
    (route) => route.abort("blockedbyclient"),
  );
});

async function expectNoAxeViolations(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const summary = violations.map(
    (v) =>
      `${v.id}: ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(" "))
        .join(" | ")}`,
  );
  expect(summary, `axe violations on ${label}`).toEqual([]);
}

for (const theme of ["light", "dark"] as const) {
  test(`axe: public and admin pages (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);

    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    await expectNoAxeViolations(page, `list (${theme})`);

    const firstCard = page
      .getByRole("list", { name: "Upcoming events" })
      .getByRole("link")
      .first();
    if (await firstCard.count()) {
      await firstCard.click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoAxeViolations(page, `detail (${theme})`);
    }

    await page.goto("/?type=meetup&format=online&from=2026-01-01");
    await expectNoAxeViolations(page, `list with filters (${theme})`);

    for (const path of ["/submit", "/sources", "/admin/login"]) {
      await page.goto(path);
      await expectNoAxeViolations(page, `${path} (${theme})`);
    }

    test.skip(!ADMIN_PASSWORD, "ADMIN_SEED_PASSWORD is not set");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expectNoAxeViolations(page, `/admin (${theme})`);
    await page.goto("/admin/sources");
    await expectNoAxeViolations(page, `/admin/sources (${theme})`);
  });
}

test("dark toggle switches theme and persists across reloads", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(html).toHaveClass(/dark/);
  await page.reload();
  await expect(html).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(html).not.toHaveClass(/dark/);
});

test("filters drive the URL, chips remove one filter, Clear resets", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("checkbox", { name: "Meetup" }).check();
  await page.getByRole("checkbox", { name: "Workshop" }).check();
  await page.getByLabel("Format").selectOption("online");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/type=meetup&type=workshop&format=online$/);
  // Empty fields are not carried in the URL.
  expect(page.url()).not.toMatch(/[?&](q|range|from|to)=/);

  const chips = page.getByRole("list", { name: "Active filters" });
  await chips.getByRole("link", { name: "Remove filter Meetup" }).click();
  await expect(page).toHaveURL(/\?type=workshop&format=online$/);
  await expect(
    page.getByRole("checkbox", { name: "Meetup" }),
  ).not.toBeChecked();

  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("list", { name: "Active filters" })).toHaveCount(
    0,
  );
});

test("keyboard: skip link is first and focus is visible", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveText("Skip to content");
  await expect(focused).toBeVisible();
  const outline = await focused.evaluate(
    (el) => getComputedStyle(el).outlineStyle,
  );
  expect(outline).not.toBe("none");
});
