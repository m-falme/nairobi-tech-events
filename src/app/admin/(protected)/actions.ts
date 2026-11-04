"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { requireAdminAction } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { editSchema, formToObject, idSchema } from "@/lib/review";

async function setStatus(fd: FormData, status: "approved" | "rejected") {
  await requireAdminAction();
  const { id } = idSchema.parse(formToObject(fd));
  await prisma.event.updateMany({
    where: { id, status: "pending" },
    data: { status },
  });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function approveEvent(fd: FormData) {
  await setStatus(fd, "approved");
}

export async function rejectEvent(fd: FormData) {
  await setStatus(fd, "rejected");
}

export type EditState = { errors?: Record<string, string[]> };

export async function editAndApprove(
  _prev: EditState,
  fd: FormData,
): Promise<EditState> {
  await requireAdminAction();
  const parsed = editSchema.safeParse(formToObject(fd));
  if (!parsed.success)
    return {
      errors: parsed.error.flatten().fieldErrors as EditState["errors"],
    };
  const { id, ...data } = parsed.data;
  await prisma.event.update({
    where: { id },
    data: { ...data, status: "approved" },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function logout() {
  await signOut({ redirectTo: "/admin/login" });
}
