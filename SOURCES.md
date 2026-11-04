# Event Sources — Nairobi Tech Events Board

Last checked: 2026-11-04

**Policy: no scraping.** We use only official APIs or official feeds (iCal/RSS) that the platform publishes. Where neither is available or affordable on free tiers, an admin enters the event manually with a link back to the original listing. No HTML scraping, no headless browsers, no bypassing bot protection. No scheduled import is in scope for PR 0; this file is docs only.

## Summary

| Source | Official API | Free? | Official feed | Access method we'll use | Fallback |
|---|---|---|---|---|---|
| Luma (luma.com / lu.ma) | Yes, `public-api.luma.com` (manages *own* calendar only) | No: needs Luma Plus | Yes: per-calendar and per-city "Add iCal Subscription" | Official iCal subscription for selected Nairobi calendars | Manual entry |
| GDG (gdg.community.dev, Bevy) | Yes, Bevy public API at `https://gdg.community.dev/api/` | Read/search endpoints answer without a key (rate-limited) | None verified | Bevy public read API (`/api/search/event/`) for Nairobi-area chapters | Manual entry |
| Meetup | Yes, GraphQL `api.meetup.com/gql-ext` | No: needs Meetup Pro | Yes: group iCal and RSS | Official per-group iCal feed | Manual entry |
| Eventbrite | Yes, REST v3 (public search shut down 2019) | Free key, but only per-event/venue/org lookups | None verified | Manual entry by admin; optional API lookup by event ID | Manual entry |

---

## Luma

- **Terms:** [Luma Terms of Use](https://luma.com/terms) (Luma Labs, Inc.). The fetched excerpt covers Luma's role in events. The full clause on automated access is **unverified**, so we assume no scraping is allowed.
  - Note: `lumalabs.ai/legal/api-terms-of-use` belongs to **Luma AI, Inc.**, a different company. It does not apply here.
- **Official API:** [Getting Started](https://docs.luma.com/reference/getting-started-with-your-api). Base URL `https://public-api.luma.com`, header `x-luma-api-key`. **Requires Luma Plus (paid).** Keys are created at [luma.com/calendar/manage/api-keys](https://luma.com/calendar/manage/api-keys). Each key is scoped to a single calendar *you manage*, so it can't be used to discover other people's events.
- **Official feed:** [iCal Syncing help](https://help.luma.com/p/ical-syncing) describes live iCal subscriptions for (a) a specific Luma Calendar ("Add iCal Subscription" in the calendar sidebar, covering all published events) and (b) a Discover city page (e.g. `lu.ma/sf`, covering upcoming approved events in that city). The exact ICS URL pattern (believed to be like `https://api.lu.ma/ics/get?entity=calendar&id=cal-…`) is **unverified**. Copy it from the "Add iCal Subscription" button, not from a guess. A Nairobi Discover page is **unverified**.
- **Method we'll use:** an admin registers the iCal URLs of chosen Nairobi community calendars, and the app reads those official feeds. No Luma Plus, no scraping.
- **Fallback:** manual entry with a link to the lu.ma event.

## GDG (Google Developer Groups, on Bevy)

- **Terms:** [GDG Event Participation Terms](https://gdg.community.dev/participation-terms/) (agreement with Google; chapters are run by independent organizers). Also see [Google Terms of Service](https://policies.google.com/terms). What they say about automated access to gdg.community.dev is **unverified**. We'll use only the documented API.
- **Official API:** Bevy public API. See [Using public Bevy APIs](https://help.bevy.com/hc/en-us/articles/20800961964695-Using-public-Bevy-APIs) and [Find chapters and events with the public API](https://help.bevy.com/hc/en-us/articles/44568356700311-Find-chapters-and-events-with-the-public-API). Base URL is the community domain plus `/api`, so `https://gdg.community.dev/api/`. Endpoints: `GET /api/search/event/` (`q`, `latitude`, `longitude`, `around_radius` km, `chapter`, `status`), `GET /api/event/`, `GET /api/chapter/{id}/event/`. Auth is `Authorization: Token <key>` when required, and only HQ admins can get keys. On 2026-11-04, `GET https://gdg.community.dev/api/search/event/?q=nairobi` returned JSON without a key. Search endpoints are limited to 50 requests/min per user or IP, plus a daily account limit (429 with `Retry-After`). Whether third-party read use is permitted by Bevy/Google terms is **unverified**. We need to confirm this before automating.
- **Official feed:** no official iCal/RSS for GDG chapters found (**unverified**).
- **Method we'll use:** the Bevy public read API (event search near Nairobi / by Nairobi chapter IDs), triggered manually by an admin, at low volume, within the rate limits.
- **Fallback:** manual entry with a link to the gdg.community.dev event page.

## Meetup

- **Terms:** Meetup Terms of Service at https://www.meetup.com/terms/ (behind a bot check from our fetcher, so the content is **unverified**). The [Meetup API License Terms](https://www.meetup.com/graphql/) are linked from the API intro and supplement the ToS. Their exact wording on scraping is **unverified**.
- **Official API:** GraphQL at `https://api.meetup.com/gql-ext` with an OAuth Bearer token. See the [API guide](https://www.meetup.com/graphql/guide/). Rate limit is 500 points per 60s. **Requires an active Meetup Pro subscription** (from ~$47–55/group/month), so there's no free tier. See [How can I get access to Meetup's API?](https://help.meetup.com/hc/en-us/articles/41453576628749-How-can-I-get-access-to-Meetup-s-API), [API access on Pro expiry](https://help.meetup.com/hc/en-us/articles/41467209211917-What-happens-to-my-API-access-when-my-Meetup-Pro-subscription-expires), and [prices](https://help.meetup.com/hc/en-us/articles/28677808413197-Organizer-Subscription-prices-overview).
- **Official feeds (verified 2026-11-04):**
  - iCal: `https://www.meetup.com/<group-urlname>/events/ical/` (returns `text/calendar`, e.g. `nairobi-gophers`)
  - RSS: `https://www.meetup.com/<group-urlname>/events/rss/` (returns `application/rss+xml`)
- **Method we'll use:** the official per-group iCal feed for a curated list of Nairobi groups. It's free and needs no key.
- **Fallback:** manual entry with a link to the meetup.com event.

## Eventbrite

- **Terms:** [Eventbrite API Terms of Use](https://www.eventbrite.com/help/en-us/articles/833731/eventbrite-api-terms-of-use/) (last updated May 30, 2025). You may store content about *future* events only, not past events without user permission. Any displayed listing must show the title and a direct, crawlable (no `nofollow`) link to the Eventbrite page. No reselling or stand-alone commercial use of the API. General Terms of Service exist, but the URL and scraping clause are **unverified**.
- **Official API:** [Eventbrite API docs](https://www.eventbrite.com/platform/new/api), v3 REST with an OAuth/private token. **Public event search (`/v3/events/search/`) was shut down on 2019-12-12** ([changelog](https://www.eventbrite.com/platform/docs/changelog)). What remains: `GET /v3/events/:id/`, `GET /v3/venues/:id/events/`, and `GET /v3/organizations/:id/events/` (the last for your own or authorized organizations). Broad public access needs the distribution partner program. Free personal keys are generally available, but this is **unverified** this turn.
- **Official feed:** none verified (**unverified**).
- **Method we'll use:** manual entry by an admin who pastes the Eventbrite URL. An optional later step is to look up details with `GET /v3/events/:id/`, which keeps the required title and link and stores no past events.
- **Fallback:** manual entry (primary).

## Out of scope for PR 0
No code, no importer, no scheduled jobs, no deploys. Mark reviews this document before PR 1.
