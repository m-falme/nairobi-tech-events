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
