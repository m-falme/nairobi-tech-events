"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import {
  clientIp,
  hashIp,
  submitCore,
  type SubmitState,
} from "@/lib/submissions";

export async function submitEvent(
  _prev: SubmitState,
  fd: FormData,
): Promise<SubmitState> {
  const ip = clientIp(await headers());
  const salt = process.env.AUTH_SECRET ?? "";
  return submitCore(
    { db: prisma, ipHash: hashIp(ip, salt), now: new Date() },
    fd,
  );
}
