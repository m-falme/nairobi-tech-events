/** Attributes for links that leave the site: new tab, no opener/referrer. */
export const EXTERNAL_LINK_PROPS = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

/** Screen-reader suffix announced on every external link. */
export const NEW_TAB_TEXT = " (opens in new tab)";
