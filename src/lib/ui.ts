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
