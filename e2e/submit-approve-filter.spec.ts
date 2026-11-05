import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "";

// No live external calls: the browser may only talk to the app under test.
test.beforeEach(async ({ context, baseURL }) => {
  const appOrigin = new URL(baseURL!).origin;
  await context.route(
    (url) => url.origin !== appOrigin,
    (route) => route.abort("blockedbyclient"),
  );
});

/** datetime-local value for N days from now at 18:00 Nairobi time. */
function eatInput(daysAhead: number): string {
  const d = new Date(Date.now() + 3 * 3600_000 + daysAhead * 86_400_000);
  return `${d.toISOString().slice(0, 10)}T18:00`;
}

test("submit → admin approves → listed → filters", async ({ page }) => {
  test.skip(!ADMIN_PASSWORD, "ADMIN_SEED_PASSWORD is not set");
  const stamp = Date.now();
  const title = `E2E Online Workshop ${stamp}`;

  // 1. Public submission (online, no venue).
  await page.goto("/submit");
  await page.getByLabel("Title (required)").fill(title);
  await page.getByLabel("Starts, EAT (required)").fill(eatInput(3));
  await page
    .getByLabel("Official event URL (required)")
    .fill(`https://example.com/e2e-${stamp}`);
  await page.getByLabel("Type (required)").selectOption("workshop");
  await page.getByLabel("Online event").check();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByRole("status")).toContainText("pending review");

  // 2. Not public until approved.
  await page.goto(`/?q=${encodeURIComponent(title)}`);
  await expect(
    page.getByRole("heading", { name: "No events found" }),
  ).toBeVisible();

  // 3. Admin signs in and approves it.
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const item = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: title }),
  });
  await expect(item).toContainText("Online");
  await item.getByRole("button", { name: `Approve: ${title}` }).click();
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0);

  // 4. Appears in the public list.
  await page.goto("/");
  const link = page.getByRole("link", { name: title });
  await expect(link).toBeVisible();

  // 5. Filters: search + type + format=online keep it...
  await page.getByLabel("Search").fill(title);
  await page.getByRole("checkbox", { name: "Workshop" }).check();
  await page.getByLabel("Format").selectOption("online");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/format=online/);
  await expect(page.getByText("1 upcoming event")).toBeVisible();
  await expect(link).toBeVisible();

  // ...while in-person or another type hides it (empty state).
  await page.getByLabel("Format").selectOption("in-person");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/format=in-person/);
  await expect(
    page.getByRole("heading", { name: "No events found" }),
  ).toBeVisible();
  await expect(page.getByText("Try removing some filters.")).toBeVisible();

  // 6. Detail page.
  await page.goto(`/?q=${encodeURIComponent(title)}`);
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page).toHaveTitle(`${title} · Nairobi Tech Events`);
});

test("unknown event shows the 404 page with its title", async ({ page }) => {
  const res = await page.goto("/events/00000000-0000-4000-8000-000000000000");
  expect(res?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Event not found" }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Event not found · Nairobi Tech Events");
  // The server-rendered HTML must carry the title too (not just the client).
  const html = await (await page.request.get(page.url())).text();
  expect(html).toContain(
    "<title>Event not found · Nairobi Tech Events</title>",
  );
});

test("unknown route shows the site 404", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page).toHaveTitle("Page not found · Nairobi Tech Events");
});

test("/sources lists feeds without internal details", async ({ page }) => {
  await page.goto("/sources");
  await expect(
    page.getByRole("heading", { name: "Where listings come from" }),
  ).toBeVisible();
  const table = page.getByRole("table");
  await expect(table.getByRole("columnheader")).toHaveText([
    "Name",
    "Method",
    "Status",
    "Link",
  ]);
  await expect(table.getByRole("row")).not.toHaveCount(1);
  await expect(page.getByText(/last error/i)).toHaveCount(0);
});
