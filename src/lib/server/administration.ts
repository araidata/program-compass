import "server-only";
import { authenticationDisabled } from "@/lib/auth-mode";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "./db";
import { HttpError } from "./access";
import type { Prisma } from "@/generated/prisma/client";
import { createUserSchema, updateUserSchema } from "@/lib/validation";
import type { z } from "zod";

export const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
} as const;

// Serialize administrative mutations, then recheck the actor inside the transaction.
export async function administrativeTransaction<T>(
  actorId: string | null,
  action: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return db().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(87341602)`;
    if (!authenticationDisabled) {
      if (!actorId) throw new HttpError(403, "Access denied");
      const actor = await tx.user.findUnique({ where: { id: actorId } });
      if (!actor?.active || actor.role !== "admin")
        throw new HttpError(403, "Access denied");
    }
    return action(tx);
  });
}

export async function createUser(
  actorId: string | null,
  data: z.infer<typeof createUserSchema>,
) {
  const password = await hashPassword(data.password);
  return administrativeTransaction(actorId, async (tx) => {
    if (await tx.user.findUnique({ where: { email: data.email } }))
      throw new HttpError(409, "Account already exists");
    const id = randomUUID();
    const user = await tx.user.create({
      data: {
        id,
        name: data.name,
        email: data.email,
        role: data.role,
        accounts: {
          create: { accountId: id, providerId: "credential", password },
        },
      },
      select: publicUser,
    });
    await tx.changeEvent.create({
      data: {
        actorId,
        action: "user.created",
        entityType: "User",
        entityId: id,
        details: { role: data.role, active: true },
      },
    });
    return user;
  });
}

export async function updateUser(
  actorId: string | null,
  id: string,
  data: z.infer<typeof updateUserSchema>,
) {
  return administrativeTransaction(actorId, async (tx) => {
    const before = await tx.user.findUnique({ where: { id } });
    if (!before) throw new HttpError(404, "Account not found");
    if (
      before.role === "admin" &&
      before.active &&
      (data.role !== "admin" || !data.active)
    ) {
      if (
        (await tx.user.count({ where: { role: "admin", active: true } })) <= 1
      )
        throw new HttpError(409, "Keep at least one active administrator");
    }
    const user = await tx.user.update({
      where: { id },
      data,
      select: publicUser,
    });
    await tx.session.deleteMany({ where: { userId: id } });
    await tx.changeEvent.create({
      data: {
        actorId,
        action: "user.updated",
        entityType: "User",
        entityId: id,
        details: {
          before: { role: before.role, active: before.active },
          after: data,
        },
      },
    });
    return user;
  });
}
