"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { addSourceCore, type SourceFormState } from "@/lib/sources-admin";

export async function addSource(
  _prev: SourceFormState,
  fd: FormData,
): Promise<SourceFormState> {
  const r = await addSourceCore({ getSession: () => auth(), db: prisma }, fd);
  if (r.ok) revalidatePath("/admin/sources");
  return r;
}
