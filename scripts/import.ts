import { PrismaClient } from "@prisma/client";
import { DEFAULT_USER_AGENT, fetchText } from "../src/lib/importer/fetch";
import { runImport } from "../src/lib/importer/run";

const prisma = new PrismaClient();
const userAgent = process.env.IMPORT_USER_AGENT?.trim() || DEFAULT_USER_AGENT;

async function main() {
  const results = await runImport({
    db: prisma,
    fetchText: (url) => fetchText(url, { userAgent }),
    log: (m) => console.log(m),
  });
  for (const r of results)
    console.log(
      `${r.status.padEnd(11)} ${r.name}${r.error ? ` (${r.error})` : ""}`,
    );
  if (results.some((r) => r.status === "failed")) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
