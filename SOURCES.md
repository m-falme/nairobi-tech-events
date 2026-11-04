# Event Sources — Nairobi Tech Events Board

Last checked: 2026-11-04 (robots.txt files re-fetched 2026-11-04)

**Policy: no scraping.** We use only official APIs or official feeds (iCal/RSS) that the platform publishes. Where neither is available or affordable on free tiers, an admin enters the event manually with a link back to the original listing. No HTML scraping, no headless browsers, no bypassing bot protection. This file is docs only; it records which sources the importer (PR 8) may use.

**Importer rule (PR 8):** the importer pulls **Luma iCal feeds only**, only from sources marked **Verified**, and only from Luma calendars with Status **approved** in the table below. As of 2026-11-04 no source is Verified (Luma is pending Mark's read of luma.com/terms), so nothing is imported yet. GDG, Meetup and Eventbrite stay manual entry / submissions until a human (Mark) confirms their terms and this file is updated.

**Importer limits:**

- Poll at most every 6 hours.
- One request per calendar per run.
- User-Agent: `NairobiTechEventsBot/1.0 (+mailto:mburumark096@gmail.com)`.
- Exponential backoff on 4xx, 5xx and 429 responses.
- Store the source event link with every imported event.
- Drop images; never download or copy them.

## Summary

| Source                        | Official API                                      | Access method                   | Terms/robots OK?                                   | Automated access |
| ----------------------------- | ------------------------------------------------- | ------------------------------- | -------------------------------------------------- | ---------------- |
| Luma (luma.com / lu.ma)       | Paid (Luma Plus), not used                        | Official iCal feed per calendar | Unverified, pending Mark's read of luma.com/terms  | Unverified       |
| GDG (gdg.community.dev, Bevy) | Not used (robots.txt: `Disallow: /api/`, `/gql/`) | Manual entry / submissions      | No for API; terms Unverified (Bevy help pages 403) | Unverified       |
| Meetup                        | GraphQL, needs paid Meetup Pro                    | Manual entry / submissions      | Unverified (terms pages 403); RSS: No (robots.txt) | Unverified       |
| Eventbrite                    | REST v3; public search shut down 2019             | Manual entry / submissions      | Unverified (API terms page 403)                    | Unverified       |

---

## Luma

- **Terms:** [Luma Terms of Use](https://luma.com/terms) (Luma Labs, Inc.), fetched 2026-11-04. Relevant clauses, quoted exactly:
  - Acceptable Use: "you must not access the Service by any means other than our publicly supported interfaces."
  - Site Content: "You may not reproduce, republish, distribute, display, perform, transmit, sell, or otherwise use any Site Content without our express written permission, except when such actions occur in connection with bona fide uses of the Service through our publicly supported interfaces."
  - Images: "users are prohibited from downloading, republication, retransmission, reproduction, or other use of any image (and other similar content) as a stand-alone file."
  - Our reading: the iCal feed is a publicly supported interface, so this plan relies on the bona-fide-use exception. Luma has not confirmed that reading, so Mark must read the terms before Luma becomes Verified. We never copy images.
  - Note: `lumalabs.ai/legal/api-terms-of-use` belongs to **Luma AI, Inc.**, a different company. It does not apply here.
- **Official API:** [Getting Started](https://docs.luma.com/reference/getting-started-with-your-api). **Requires Luma Plus (paid)** and is scoped to calendars _you manage_. Not used.
- **Official feed (checked 2026-11-04):** [iCal Syncing help](https://help.luma.com/p/ical-syncing) states "Luma offers iCal subscriptions" and that a Luma Calendar's sidebar **Add iCal Subscription** feed "includes all published events on that calendar". Feed URL: `https://api.lu.ma/ics/get?entity=calendar&id=<cal-id>`. The help page describes subscriptions for personal calendar apps (Google Calendar, Apple Calendar, Outlook), not third-party republishing.
- **robots.txt (checked 2026-11-04):** `https://lu.ma/robots.txt` redirects to `https://luma.com/robots.txt`, which has rules only for `User-agent: Googlebot` (`/social-share`, `/in/`, `/company/`, `/session-*`) and no `User-agent: *` group. `https://api.lu.ma/robots.txt` has `User-agent: *` with only `Disallow: /insights/`. `/ics` is not disallowed.
- **Terms/robots allow our method:** Unverified. robots.txt does not disallow `/ics`, but the terms permit republishing only under the bona-fide-use exception above.
- **Automated access:** Unverified, pending Mark's read of luma.com/terms.
- **Method:** official iCal feed per calendar, `https://api.lu.ma/ics/get?entity=calendar&id=<cal-id>`, low volume.
- **Fallback:** manual entry / submissions with a link to the Luma event.

### Luma calendars (candidates)

Calendar IDs were taken from the public calendar page data, then the ICS URL was fetched once to confirm `text/calendar` and the calendar name. These are the same IDs the Add iCal Subscription button exposes, but that is not consent to republish. The importer only pulls calendars with Status **approved**, meaning approved by the calendar's organizer or by Mark, with who approved and when recorded in this table.

| Name                       | Calendar page                                                            | Calendar ID           | ICS verified                                                | Date       | Status    |
| -------------------------- | ------------------------------------------------------------------------ | --------------------- | ----------------------------------------------------------- | ---------- | --------- |
| Tech Kenya Events Calendar | [luma.com/techkenya](https://luma.com/techkenya)                         | `cal-tNFqmDwu6YpmOOJ` | Yes (`text/calendar`, X-WR-CALNAME matches, 73 events)      | 2026-11-04 | candidate |
| QuantumKE                  | [luma.com/quantumke](https://luma.com/quantumke)                         | `cal-Cpt1V9LBIY4ETmr` | Yes (`text/calendar`, X-WR-CALNAME matches, 10 events)      | 2026-11-04 | candidate |
| Nairobi (Discover city)    | [luma.com/nairobi](https://luma.com/nairobi)                             | to collect            | No (city page, not a calendar; general, not tech-only)      | 2026-11-04 | candidate |
| Tech Events in Nairobi     | [luma.com/discover/nairobi/tech](https://luma.com/discover/nairobi/tech) | to collect            | No (Discover category page; organiser calendars to collect) | 2026-11-04 | candidate |

## GDG (Google Developer Groups, on Bevy)

- **Terms:** [GDG Event Participation Terms](https://gdg.community.dev/participation-terms/) and [Google Terms of Service](https://policies.google.com/terms). What they say about automated access to gdg.community.dev is **unverified**. The Bevy help pages ([Using public Bevy APIs](https://help.bevy.com/hc/en-us/articles/20800961964695-Using-public-Bevy-APIs)) returned 403 to automated fetches and need a manual read by Mark; they have not been read.
- **robots.txt (re-fetched 2026-11-04):** `https://gdg.community.dev/robots.txt` contains `Disallow: /api/` and `Disallow: /gql/`. The Bevy API plan is therefore **dropped**; we will not call `/api/` or `/gql/` endpoints.
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

## Out of scope for this document

This document adds no code, importer, scheduled jobs or deploys. It was first added in PR 0 (#1), followed by PR 1 (#2, Scaffold); both are merged. These review fixes (#4) update it before the importer is built in PR 8.
