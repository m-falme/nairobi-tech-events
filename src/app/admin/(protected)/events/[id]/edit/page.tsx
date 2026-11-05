import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isUuid } from "@/lib/event-detail";
import { toEatInput } from "@/lib/review";
import { EditForm } from "./edit-form";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const e = await prisma.event.findUnique({ where: { id } });
  if (!e || e.status !== "pending") notFound();
  return (
    <main className="mt-6">
      <h1 className="text-2xl font-bold tracking-tight">Edit and approve</h1>
      <EditForm
        event={{
          id: e.id,
          title: e.title,
          description: e.description,
          startsAt: toEatInput(e.startsAt),
          endsAt: e.endsAt ? toEatInput(e.endsAt) : "",
          venue: e.venue ?? "",
          organiser: e.organiser ?? "",
          isOnline: e.isOnline,
          type: e.type,
          url: e.url,
        }}
      />
    </main>
  );
}
