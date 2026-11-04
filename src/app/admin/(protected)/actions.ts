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
  await setStatusCore(deps, fd, "approved");
  refresh();
}

export async function rejectEvent(fd: FormData) {
  await setStatusCore(deps, fd, "rejected");
  refresh();
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
