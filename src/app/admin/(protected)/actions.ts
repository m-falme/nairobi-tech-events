"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import {
  editAndApproveCore,
  setStatusCore,
  type ReviewDeps,
} from "@/lib/review-actions";

const deps: ReviewDeps = { getSession: () => auth(), db: prisma };

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function approveEvent(fd: FormData) {
  const r = await setStatusCore(deps, fd, "approved");
  refresh();
  if (!r.ok) redirect("/admin?notice=not-pending");
}

export async function rejectEvent(fd: FormData) {
  const r = await setStatusCore(deps, fd, "rejected");
  refresh();
  if (!r.ok) redirect("/admin?notice=not-pending");
}

export type EditState = { error?: string; errors?: Record<string, string[]> };

export async function editAndApprove(
  _prev: EditState,
  fd: FormData,
): Promise<EditState> {
  const r = await editAndApproveCore(deps, fd);
  if (!r.ok) return { error: r.error, errors: r.errors };
  refresh();
  redirect("/admin");
}

export async function logout() {
  await signOut({ redirectTo: "/admin/login" });
}
