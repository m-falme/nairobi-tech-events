import { PrismaClient } from "@prisma/client";
import { backfillNormalizedUrls } from "../src/lib/backfill-normalized-url";

const prisma = new PrismaClient();

backfillNormalizedUrls(prisma)
  .then((n) => console.log(`Backfilled normalized_url on ${n} events`))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
