# Event Sources — Nairobi Tech Events Board

Last checked: 2026-11-04 (robots.txt files re-fetched 2026-11-04)

**Policy: no scraping.** We use only official APIs or official feeds (iCal/RSS) that the platform publishes. Where neither is available or affordable on free tiers, an admin enters the event manually with a link back to the original listing. No HTML scraping, no headless browsers, no bypassing bot protection. No scheduled import is in scope for PR 0; this file is docs only.

**Importer rule (PR 8):** the importer pulls **Luma iCal feeds only**, and only from sources marked **Verified** below. Luma is the only Verified source (checked 2026-11-04). GDG, Meetup and Eventbrite stay manual entry / submissions until a human (Mark) confirms their terms and this file is updated.

## Summary

| Source                        | Official API                                      | Access method                   | Terms/robots OK?                                   | Automated access |
| ----------------------------- | ------------------------------------------------- | ------------------------------- | -------------------------------------------------- | ---------------- |
| Luma (luma.com / lu.ma)       | Paid (Luma Plus), not used                        | Official iCal feed per calendar | Yes (help doc + robots.txt, 2026-11-04)            | Verified         |
| GDG (gdg.community.dev, Bevy) | Not used (robots.txt: `Disallow: /api/`, `/gql/`) | Manual entry / submissions      | No for API; terms Unverified (Bevy help pages 403) | Unverified       |
| Meetup                        | GraphQL, needs paid Meetup Pro                    | Manual entry / submissions      | Unverified (terms pages 403); RSS: No (robots.txt) | Unverified       |
| Eventbrite                    | REST v3; public search shut down 2019             | Manual entry / submissions      | Unverified (API terms page 403)                    | Unverified       |

---

## Luma

- **Terms:** [Luma Terms of Use](https://luma.com/terms) (Luma Labs, Inc.). The full clause on automated access was not confirmed; we rely on Luma's own documentation of iCal subscriptions plus robots.txt below.
  - Note: `lumalabs.ai/legal/api-terms-of-use` belongs to **Luma AI, Inc.**, a different company. It does not apply here.
- **Official API:** [Getting Started](https://docs.luma.com/reference/getting-started-with-your-api). **Requires Luma Plus (paid)** and is scoped to calendars _you manage_. Not used.
- **Official feed (checked 2026-11-04):** [iCal Syncing help](https://help.luma.com/p/ical-syncing) states "Luma offers iCal subscriptions" and that a Luma Calendar's sidebar **Add iCal Subscription** feed "includes all published events on that calendar". Feed URL: `https://api.lu.ma/ics/get?entity=calendar&id=<cal-id>`.
- **robots.txt (checked 2026-11-04):** `https://lu.ma/robots.txt` redirects to `https://luma.com/robots.txt`, which has rules only for `User-agent: Googlebot` (`/social-share`, `/in/`, `/company/`, `/session-*`) and no `User-agent: *` group. `https://api.lu.ma/robots.txt` has `User-agent: *` with only `Disallow: /insights/`. `/ics` is not disallowed.
- **Terms/robots allow our method:** Yes (official documented iCal feed; robots.txt does not disallow `/ics`).
- **Automated access:** Verified (2026-11-04).
- **Method:** official iCal feed per calendar, `https://api.lu.ma/ics/get?entity=calendar&id=<cal-id>`, low volume.
- **Fallback:** manual entry / submissions with a link to the Luma event.

### Luma calendars (candidates)

Calendar IDs were taken from the public calendar page, then the ICS URL was fetched once to confirm `text/calendar` and the calendar name.

| Name                       | Calendar page                                                            | Calendar ID           | ICS verified                                                | Date       |
| -------------------------- | ------------------------------------------------------------------------ | --------------------- | ----------------------------------------------------------- | ---------- |
| Tech Kenya Events Calendar | [luma.com/techkenya](https://luma.com/techkenya)                         | `cal-tNFqmDwu6YpmOOJ` | Yes (`text/calendar`, X-WR-CALNAME matches, 73 events)      | 2026-11-04 |
| QuantumKE                  | [luma.com/quantumke](https://luma.com/quantumke)                         | `cal-Cpt1V9LBIY4ETmr` | Yes (`text/calendar`, X-WR-CALNAME matches, 10 events)      | 2026-11-04 |
| Nairobi (Discover city)    | [luma.com/nairobi](https://luma.com/nairobi)                             | to collect            | No (city page, not a calendar; general, not tech-only)      | 2026-11-04 |
| Tech Events in Nairobi     | [luma.com/discover/nairobi/tech](https://luma.com/discover/nairobi/tech) | to collect            | No (Discover category page; organiser calendars to collect) | 2026-11-04 |

## GDG (Google Developer Groups, on Bevy)

- **robots.txt (re-checked 2026-11-04):** also contains `Disallow: /gql/`.
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
- **Candidate after confirmation:** the official per-group iCal feed (not used now: the API needs paid Pro and RSS is blocked).

## Eventbrite

- **Possible later addition:** the organization events endpoint (`GET /v3/organizations/:id/events/`) for organisers who authorise us. Not in scope now.
- **Terms:** [Eventbrite API Terms of Use](https://www.eventbrite.com/help/en-us/articles/833731/eventbrite-api-terms-of-use/). This page returned 403 to automated fetches and needs a manual read by Mark; its contents are not confirmed here.
- **Official API:** [Eventbrite API docs](https://www.eventbrite.com/platform/new/api), v3 REST. **Public event search (`/v3/events/search/`) was shut down on 2019-12-12** ([changelog](https://www.eventbrite.com/platform/docs/changelog)). Remaining endpoints look up known events, venues or organizations only.
- **Official feed:** none verified (**unverified**).
- **Terms/robots allow our method:** Unverified (API terms need manual read by Mark).
- **Automated access:** Unverified.
- **Method now:** manual entry / submissions by pasting the Eventbrite URL.
- **Candidate after confirmation:** optional per-event lookup with `GET /v3/events/:id/`; no feed.

## Out of scope for PR 0

No code, no importer, no scheduled jobs, no deploys. Mark reviews this document before PR 1 (#2, Scaffold).
