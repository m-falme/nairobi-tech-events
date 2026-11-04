import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
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
    const existing = await prisma.source.findFirst({ where: { name: s.name } });
    const row = existing
      ? await prisma.source.update({ where: { id: existing.id }, data: s })
      : await prisma.source.create({ data: s });
    ids[key] = row.id;
  }

  for (const { sourceKey, ...e } of seedEvents) {
    const data = {
      ...e,
      sourceId: sourceKey ? ids[sourceKey] : null,
      startsAt: new Date(e.startsAt),
      endsAt: e.endsAt ? new Date(e.endsAt) : null,
    };
    const existing = await prisma.event.findFirst({ where: { url: e.url } });
    if (existing)
      await prisma.event.update({ where: { id: existing.id }, data });
    else await prisma.event.create({ data });
  }

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
