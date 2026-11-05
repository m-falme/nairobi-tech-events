/** Visible keyboard focus ring using the theme ring colour. */
export const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Horizontal padding shared by header, footer and page content. */
export const gutter = "px-4 sm:px-6";

/** Max content width (~1100px), centred. */
export const contentWidth = "mx-auto w-full max-w-[1100px]";

/** Page body wrapper: content width + gutter + vertical rhythm. */
export const shell = `${contentWidth} ${gutter} py-8`;

/** Typography tokens. */
export const pageTitle = "text-3xl font-bold tracking-tight";
export const lead = "mt-2 text-muted-foreground";

/** Form controls (≥44px tap target). */
export const input = `mt-1 block min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${focus}`;
export const label = "block text-sm font-medium";

const btn = `inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium disabled:opacity-60 ${focus}`;
export const btnPrimary = `${btn} bg-primary text-primary-foreground hover:bg-primary/90`;
export const btnOutline = `${btn} border border-input bg-background hover:bg-accent hover:text-accent-foreground`;
export const btnApprove = `${btn} bg-green-700 text-white hover:bg-green-800`;
export const btnReject = `${btn} bg-red-700 text-white hover:bg-red-800`;

/** Alerts: border + tinted bg, readable in both themes. */
const alert = "rounded-md border p-3 text-sm";
export const alertWarn = `${alert} border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100`;
export const alertError = `${alert} border-red-600 bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100`;
export const alertSuccess = `${alert} border-green-600 bg-green-50 text-green-950 dark:bg-green-950/40 dark:text-green-100`;
