# Build prompts

Approved build plan for the Nairobi Tech Events Board, as supplied by Forge Lead.

1. Scaffold
2. Database
3. CI
4. List and filters
5. Detail page
6. Admin and review queue
7. Submissions
8. Importers (Luma iCal only, cron disabled until launch)
9. E2E and polish

## Prompt 4: List and filters

> Public list and filters: stories 1 and 2, show times in EAT, unit tests for the filter-to-query builder.

### Story 1

> Approved, NOT-YET-ENDED events (use end time >= now, falling back to start when no end), soonest first; each shows title, date/time in EAT, venue or 'Online', type and SOURCE; 20/page; empty state.

### Story 2

> Date filter with presets today / this week / this month / custom range (EAT), type MULTI-select (e.g. repeated ?type=), online vs in-person; URL-reflected and shareable; clearing resets.

### Implementation notes

- Date presets use `?range=today|week|month` (EAT, week Monday to Sunday); a custom `from`/`to` range can be combined with a preset (the bounds intersect).
- Type multi-select accepts repeated `?type=` or a comma list.

### Approved deviations

- No price (free/paid) filter: the schema has no price field.
- Event type is used as the category filter (no tags in the schema).
- List items link out to the event's source URL until the detail page lands in PR 5.

## Stories

3. Event detail. AC: shows the full description, time, location, organiser, and a button to the official event URL. The page has Open Graph tags. An unknown or unapproved id returns a 404.
4. Submit an event. AC: required fields are title, start time, URL and type; end time, venue and description are optional. URLs are validated, and there's a honeypot field and a rate limit of 5 per IP per hour. The submission is saved as pending, and the submitter sees a 'pending review' message.
5. Admin review. AC: there's an admin login. The admin sees a queue of pending items, can approve, edit and approve, or reject each one, and can see duplicate warnings (same URL, or similar title on the same day).
6. Feed import. AC: the admin adds a source with a name, type (ical, rss or api) and URL. A scheduled job (GitHub Actions cron, every 6 hours) fetches each active source and upserts events by (source_id, external_id). New items from untrusted sources go to pending, and items from trusted sources are auto-approved. Fetch errors are logged on the source, and one source failing doesn't stop the run.

## Build prompts 5–9

5. Detail page: story 3, with Open Graph tags and 404s.
6. Admin auth and review queue: story 5, including the duplicate check, with unit tests for it.
7. Public submissions: story 4, with the honeypot and the rate limit.
8. Importers: an iCal and RSS fetcher behind a `SourceAdapter` interface, with upserts and an import_runs record per run. Add a `npm run import` script, a scheduled GitHub Actions workflow that runs the import against the database secret (enabled only after launch approval), and tests against recorded fixture feeds with no live calls.
9. End-to-end tests and polish: a Playwright test for the path submit, approve, appears in the list, then filter. Add empty and error states and a /sources page that shows where listings come from.

## Approved overrides for PR 8

Import from Luma iCal only, and only the Tech Kenya Events Calendar (cal-tNFqmDwu6YpmOOJ) and QuantumKE (cal-Cpt1V9LBIY4ETmr). Text fields only, no images, link back to the official event page, poll at most every 6 hours. The cron stays disabled until launch approval. Auth for prompt 6 is Auth.js credentials for a single admin with bcrypt.

## Definition of done

All ACs pass, CI is green, it runs locally with one Docker command, nothing is deployed, and no cron runs against production until Mark gives launch approval.
