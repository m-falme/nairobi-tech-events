import { prisma } from "./db";
import { buildWhere, clampPage, PAGE_SIZE, type EventFilters } from "./filters";

export async function listEvents(f: EventFilters, now: Date = new Date()) {
  const where = buildWhere(f, now);
  const count = await prisma.event.count({ where });
  const page = clampPage(f.page, count);
  const events = await prisma.event.findMany({
    where,
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      venue: true,
      isOnline: true,
      type: true,
      organiser: true,
      source: { select: { name: true } },
    },
  });
  return { events, count, page };
}

export type ListedEvent = Awaited<
  ReturnType<typeof listEvents>
>["events"][number];
