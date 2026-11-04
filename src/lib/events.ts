import { prisma } from "./db";
import { buildWhere, PAGE_SIZE, type EventFilters } from "./filters";

export async function listEvents(f: EventFilters, now: Date = new Date()) {
  const where = buildWhere(f, now);
  const [events, count] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        venue: true,
        isOnline: true,
        type: true,
        url: true,
        organiser: true,
      },
    }),
    prisma.event.count({ where }),
  ]);
  return { events, count };
}

export type ListedEvent = Awaited<
  ReturnType<typeof listEvents>
>["events"][number];
