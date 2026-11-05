# UI redesign — Nairobi Tech Events Board

Visual/UX pass only. Stories 1–6 behaviour unchanged. No new features.

## Stack

Keep Next.js, TypeScript, Tailwind. Add **shadcn/ui** (Radix primitives).
Why: accessible components out of the box (focus rings, keyboard, ARIA), dark mode via CSS variables, and a consistent look without a custom design system. Free and copy-into-repo, so no extra vendor.

## Acceptance criteria

### Layout and branding

- Sticky header with app name (e.g. “Nairobi Tech Events”), primary nav links (Events, Submit, Sources), and a theme toggle.
- Footer with a one-line credit and a link to /sources.
- Max content width ~1100px, centred, with consistent horizontal padding.

### Event cards (list)

- Card shows: type badge (colour-coded: hackathon, meetup, workshop, conference, other), title, date + time in EAT, venue or “Online”, source name.
- Clear hierarchy: title largest, meta secondary.
- Hover and focus states; whole card is one clickable target to the detail page.
- Empty state with short copy and a link to Submit.

### Filter bar

- Horizontal on desktop, stacked on mobile: date preset (Today / This week / This month / Custom), type multi-select, Online / In person, Clear.
- Filters still drive the URL (unchanged behaviour).
- Active filters visible as chips or selected controls.

### Event detail

- Title, type badge, full EAT datetime range, venue or Online, organiser, description, primary CTA to the official URL (opens in a new tab with rel=noopener).
- Breadcrumb or back link to the list that keeps current filters when possible.

### Submit and admin

- Submit: labelled fields, inline validation, honeypot unchanged; success state matches “pending review”.
- Admin: login page, review queue as a clear table or card list with Approve / Edit+Approve / Reject; duplicate warnings styled as alerts, not buried text.

### Dark mode

- Follows `prefers-color-scheme` by default.
- Header toggle persists choice (localStorage or cookie).
- All surfaces, badges, and borders meet contrast in both themes.

### Responsive (mobile-first)

- Usable at 320px: tap targets ≥44px, no horizontal scroll, filters usable without pinch-zoom.
- Cards stack to one column on small screens; two+ columns from ~768px.

### Accessibility

- Full keyboard nav; visible focus rings.
- Form controls have labels (not placeholder-only).
- Colour is not the only type signal (badge text + colour).
- Contrast ≥ WCAG AA for text and interactive elements in light and dark.

### Dates and times

- Display dates as **dd/mm/yyyy**.
- Times in **EAT (Africa/Nairobi)** with a short “EAT” label where helpful.
- Stored values and filters stay timezone-correct as today; this is display only.

### Out of scope

- No new stories, no maps, no RSVPs, no scraping changes, no deploy until Mark’s launch approval after this lands.

## Builder prompts (small PRs)

1. Add shadcn/ui, theme provider (next-themes), CSS variables for light/dark; wire the header toggle.
2. Rebuild shell: header, footer, typography, spacing tokens.
3. Redesign list cards + filter bar (mobile-first).
4. Redesign detail, submit, and admin pages to match.
5. A11y pass: focus, labels, contrast check; Playwright smoke that dark toggle and filters still work.

Done when the five ACs above pass visually and in Playwright, behaviour of stories 1–6 is unchanged, and CI stays green.
