# Event Sources — Nairobi Tech Events Board

Last checked: 2026-11-04 (robots.txt files re-fetched 2026-11-04)

**Policy: no scraping.** We use only official APIs or official feeds (iCal/RSS) that the platform publishes. Where neither is available or affordable on free tiers, an admin enters the event manually with a link back to the original listing. No HTML scraping, no headless browsers, no bypassing bot protection. No scheduled import is in scope for PR 0; this file is docs only.

**Importer rule (PR 8):** the importer may only fetch sources whose automated access is marked **Verified** below. Any source marked **Unverified** stays manual entry / submissions only until a human (Mark) reads its terms and updates this file. As of this check, **no source is Verified**, so every source starts as manual.

## Summary

| Source                        | Official API                                             | Free?                                          | Official feed                                           | Access method now                    | Candidate after terms confirmed         | Terms/robots OK?                                      | Automated access |
| ----------------------------- | -------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------- | ------------------------------------ | --------------------------------------- | ----------------------------------------------------- | ---------------- |
| Luma (luma.com / lu.ma)       | Yes, `public-api.luma.com` (manages _own_ calendar only) | No: needs Luma Plus                            | Yes: per-calendar and per-city "Add iCal Subscription"  | Manual entry / submissions           | Official iCal subscription              | Unverified (automated-access clause not confirmed)    | Unverified       |
| GDG (gdg.community.dev, Bevy) | Not used (robots.txt: `Disallow: /api/`)                 | n/a                                            | None verified                                           | Manual entry / submissions (primary) | Official iCal export only if one exists | No for `/api/`; feed Unverified (Bevy help pages 403) | Unverified       |
| Meetup                        | Yes, GraphQL `api.meetup.com/gql-ext`                    | No: needs Meetup Pro                           | iCal per group (RSS not used: disallowed by robots.txt) | Manual entry / submissions           | Official per-group iCal feed            | Unverified (terms and help pages 403); RSS: No        | Unverified       |
| Eventbrite                    | Yes, REST v3 (public search shut down 2019)              | Free key, but only per-event/venue/org lookups | None verified                                           | Manual entry / submissions           | None (optional per-event API lookup)    | Unverified (API terms page 403 to automated fetch)    | Unverified       |

---

## Luma

- **Terms:** [Luma Terms of Use](https://luma.com/terms) (Luma Labs, Inc.). The fetched excerpt covers Luma's role in events. The full clause on automated access is **unverified**, so we assume no scraping is allowed.
  - Note: `lumalabs.ai/legal/api-terms-of-use` belongs to **Luma AI, Inc.**, a different company. It does not apply here.
- **Official API:** [Getting Started](https://docs.luma.com/reference/getting-started-with-your-api). Base URL `https://public-api.luma.com`, header `x-luma-api-key`. **Requires Luma Plus (paid).** Keys are scoped to a single calendar _you manage_, so it can't be used to discover other people's events. Not used.
- **Official feed:** [iCal Syncing help](https://help.luma.com/p/ical-syncing) describes live iCal subscriptions for a specific Luma Calendar and for a Discover city page. The exact ICS URL pattern is **unverified**; copy it from the "Add iCal Subscription" button, not from a guess. A Nairobi Discover page is **unverified**.
- **Terms/robots allow our method:** Unverified (the automated-access clause of the terms needs a manual read by Mark).
- **Automated access:** Unverified.
- **Method now:** manual entry / submissions with a link to the lu.ma event.
- **Candidate after confirmation:** the official iCal subscription of chosen Nairobi calendars.

## GDG (Google Developer Groups, on Bevy)

- **Terms:** [GDG Event Participation Terms](https://gdg.community.dev/participation-terms/) and [Google Terms of Service](https://policies.google.com/terms). What they say about automated access to gdg.community.dev is **unverified**. The Bevy help pages ([Using public Bevy APIs](https://help.bevy.com/hc/en-us/articles/20800961964695-Using-public-Bevy-APIs)) returned 403 to automated fetches and need a manual read by Mark; they have not been read.
- **robots.txt (re-fetched 2026-11-04):** `https://gdg.community.dev/robots.txt` contains `Disallow: /api/`. The Bevy API plan is therefore **dropped**; we will not call `/api/` endpoints.
- **Official feed:** no official iCal/RSS export for GDG chapters found (**unverified**).
- **Terms/robots allow our method:** No for the API (robots.txt disallows `/api/`); Unverified for any feed.
- **Automated access:** Unverified.
- **Method now (primary):** manual entry / submissions with a link to the gdg.community.dev event page, until Bevy or Google confirm in writing that automated use is allowed.
- **Candidate after confirmation:** an official iCal export, only if one exists and robots.txt allows it.

## Meetup

- **Terms:** Meetup Terms of Service at https://www.meetup.com/terms/ and the [Meetup API License Terms](https://www.meetup.com/graphql/). The terms and help pages returned 403 to automated fetches and need a manual read by Mark; they have not been read.
- **Official API:** GraphQL at `https://api.meetup.com/gql-ext` with an OAuth Bearer token. **Requires an active Meetup Pro subscription**, so there's no free tier. See [How can I get access to Meetup's API?](https://help.meetup.com/hc/en-us/articles/41453576628749-How-can-I-get-access-to-Meetup-s-API). Not used.
- **robots.txt (re-fetched 2026-11-04):** `https://www.meetup.com/robots.txt` contains `Disallow: */events/rss/*` (also `*/calendar/*rss*`). **RSS is not to be used.**
- **Official feed:** iCal at `https://www.meetup.com/<group-urlname>/events/ical/` (returned `text/calendar` on 2026-11-04, e.g. `nairobi-gophers`).
- **Terms/robots allow our method:** Unverified (terms pages 403, need manual read by Mark); No for RSS.
- **Automated access:** Unverified.
- **Method now:** manual entry / submissions with a link to the meetup.com event.
- **Candidate after confirmation:** the official per-group iCal feed for a curated list of Nairobi groups.

## Eventbrite

- **Terms:** [Eventbrite API Terms of Use](https://www.eventbrite.com/help/en-us/articles/833731/eventbrite-api-terms-of-use/). This page returned 403 to automated fetches and needs a manual read by Mark; its contents are not confirmed here.
- **Official API:** [Eventbrite API docs](https://www.eventbrite.com/platform/new/api), v3 REST. **Public event search (`/v3/events/search/`) was shut down on 2019-12-12** ([changelog](https://www.eventbrite.com/platform/docs/changelog)). Remaining endpoints look up known events, venues or organizations only.
- **Official feed:** none verified (**unverified**).
- **Terms/robots allow our method:** Unverified (API terms need manual read by Mark).
- **Automated access:** Unverified.
- **Method now:** manual entry / submissions by pasting the Eventbrite URL.
- **Candidate after confirmation:** optional per-event lookup with `GET /v3/events/:id/`; no feed.

## Out of scope for PR 0

No code, no importer, no scheduled jobs, no deploys. Mark reviews this document before PR 1 (#2, Scaffold).
