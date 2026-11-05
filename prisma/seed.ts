import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normaliseUrl } from "../src/lib/duplicates";
import { backfillNormalizedUrls } from "../src/lib/backfill-normalized-url";
import { seedEvents, seedSources } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!password)
    throw new Error("ADMIN_SEED_PASSWORD must be set to seed the admin");

  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash: await bcrypt.hash(password, 12) },
    create: { email, passwordHash: await bcrypt.hash(password, 12) },
  });

  const ids: Record<string, string> = {};
  for (const { key, ...s } of seedSources) {
    // Upsert by the unique source key; adopt a pre-key row with the same name.
    const legacy = await prisma.source.findFirst({
      where: { key: null, name: s.name },
    });
    const row = legacy
      ? await prisma.source.update({
          where: { id: legacy.id },
          data: { ...s, key },
        })
      : await prisma.source.upsert({
          where: { key },
          update: s,
          create: { ...s, key },
        });
    ids[key] = row.id;
  }

  for (const { sourceKey, ...e } of seedEvents) {
    const data = {
      ...e,
      normalizedUrl: normaliseUrl(e.url),
      sourceId: sourceKey ? ids[sourceKey] : null,
      startsAt: new Date(e.startsAt),
      endsAt: e.endsAt ? new Date(e.endsAt) : null,
    };
    if (data.sourceId && data.externalId) {
      // Imported-style rows: upsert on the (sourceId, externalId) unique key.
      await prisma.event.upsert({
        where: {
          sourceId_externalId: {
            sourceId: data.sourceId,
            externalId: data.externalId,
          },
        },
        update: data,
        create: data,
      });
    } else {
      // NULL externalId never matches a unique index, so dedupe by URL.
      const existing = await prisma.event.findFirst({
        where: { url: e.url, externalId: null },
      });
      if (existing)
        await prisma.event.update({ where: { id: existing.id }, data });
      else await prisma.event.create({ data });
    }
  }

  const filled = await backfillNormalizedUrls(prisma);
  console.log(`Backfilled normalized_url on ${filled} events`);
  console.log(
    `Seeded 1 admin, ${seedSources.length} sources, ${seedEvents.length} events`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
