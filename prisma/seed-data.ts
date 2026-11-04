import type { EventStatus, EventType, SourceKind } from "@prisma/client";

export type SeedSource = {
  key: string;
  name: string;
  kind: SourceKind;
  url: string | null;
  trusted: boolean;
  termsNote: string;
};

export type SeedEvent = {
  sourceKey: string | null;
  externalId: string | null;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  venue: string | null;
  isOnline: boolean;
  type: EventType;
  url: string;
  organiser: string | null;
  status: EventStatus;
};

export const seedSources: SeedSource[] = [
  {
    key: "sample-ical",
    name: "Sample Nairobi iCal calendar",
    kind: "ical",
    url: "https://example.com/nairobi-tech.ics",
    trusted: true,
    termsNote: "Sample data only. Real sources follow SOURCES.md.",
  },
  {
    key: "manual",
    name: "Manual entry",
    kind: "manual",
    url: null,
    trusted: false,
    termsNote: "Events entered by hand or via the public submission form.",
  },
];

export const seedEvents: SeedEvent[] = [
  {
    sourceKey: "sample-ical",
    externalId: "ical-001",
    title: "Nairobi AI Hackathon",
    description: "48-hour build sprint on AI for agriculture.",
    startsAt: "2026-12-05T06:00:00Z",
    endsAt: "2026-12-06T15:00:00Z",
    venue: "iHub, Senteu Plaza",
    isOnline: false,
    type: "hackathon",
    url: "https://example.com/events/ai-hackathon",
    organiser: "Sample Org",
    status: "approved",
  },
  {
    sourceKey: "sample-ical",
    externalId: "ical-002",
    title: "Fintech Hack Weekend",
    description: "Build payment tools with open APIs.",
    startsAt: "2027-01-16T06:00:00Z",
    endsAt: "2027-01-17T15:00:00Z",
    venue: "Strathmore University",
    isOnline: false,
    type: "hackathon",
    url: "https://example.com/events/fintech-hack",
    organiser: "Sample Org",
    status: "pending",
  },
  {
    sourceKey: "sample-ical",
    externalId: "ical-003",
    title: "JavaScript Nairobi Monthly",
    description: "Talks and networking for JS developers.",
    startsAt: "2026-11-20T15:00:00Z",
    endsAt: "2026-11-20T18:00:00Z",
    venue: "Nairobi Garage, Westlands",
    isOnline: false,
    type: "meetup",
    url: "https://example.com/events/js-monthly",
    organiser: "Sample Org",
    status: "approved",
  },
  {
    sourceKey: "sample-ical",
    externalId: "ical-004",
    title: "Python Nairobi Online Meetup",
    description: "Remote lightning talks.",
    startsAt: "2026-11-27T15:30:00Z",
    endsAt: "2026-11-27T17:30:00Z",
    venue: null,
    isOnline: true,
    type: "meetup",
    url: "https://example.com/events/python-online",
    organiser: "Sample Org",
    status: "approved",
  },
  {
    sourceKey: "manual",
    externalId: null,
    title: "Women in Tech Coffee Meetup",
    description: "Informal morning meetup.",
    startsAt: "2026-12-12T05:30:00Z",
    endsAt: null,
    venue: "Kilimani",
    isOnline: false,
    type: "meetup",
    url: "https://example.com/events/wit-coffee",
    organiser: null,
    status: "rejected",
  },
  {
    sourceKey: "sample-ical",
    externalId: "ical-005",
    title: "Intro to Kubernetes Workshop",
    description: "Hands-on container orchestration basics.",
    startsAt: "2026-12-02T06:00:00Z",
    endsAt: "2026-12-02T12:00:00Z",
    venue: "Moringa School",
    isOnline: false,
    type: "workshop",
    url: "https://example.com/events/k8s-workshop",
    organiser: "Sample Org",
    status: "approved",
  },
  {
    sourceKey: "manual",
    externalId: null,
    title: "Figma for Developers",
    description: "Online design handoff workshop.",
    startsAt: "2026-12-09T14:00:00Z",
    endsAt: "2026-12-09T16:00:00Z",
    venue: null,
    isOnline: true,
    type: "workshop",
    url: "https://example.com/events/figma-devs",
    organiser: null,
    status: "pending",
  },
  {
    sourceKey: "sample-ical",
    externalId: "ical-006",
    title: "Nairobi Cloud Summit",
    description: "A day of cloud and DevOps talks.",
    startsAt: "2027-02-10T05:00:00Z",
    endsAt: "2027-02-10T14:00:00Z",
    venue: "KICC",
    isOnline: false,
    type: "conference",
    url: "https://example.com/events/cloud-summit",
    organiser: "Sample Org",
    status: "approved",
  },
  {
    sourceKey: "manual",
    externalId: null,
    title: "East Africa Developer Conference",
    description: "Regional developer conference.",
    startsAt: "2027-03-18T05:00:00Z",
    endsAt: "2027-03-19T14:00:00Z",
    venue: "Radisson Blu, Upper Hill",
    isOnline: false,
    type: "conference",
    url: "https://example.com/events/eadc",
    organiser: null,
    status: "pending",
  },
  {
    sourceKey: "manual",
    externalId: null,
    title: "Open Source Nairobi Day",
    description: "Community talks on open source.",
    startsAt: "2026-11-28T06:00:00Z",
    endsAt: "2026-11-28T13:00:00Z",
    venue: "Online and iHub",
    isOnline: true,
    type: "other",
    url: "https://example.com/events/oss-day",
    organiser: null,
    status: "approved",
  },
];
