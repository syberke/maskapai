// app/admin/airlines/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "UNKNOWN_ERROR";
}

export async function createAirline(data: { name: string; code: string; logoUrl?: string }) {
  try {
    await requireRole([Role.ADMIN]);

    const existing = await prisma.airline.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) throw new Error("KODE_ALREADY_EXISTS");

    await prisma.airline.create({
      data: { name: data.name, code: data.code.toUpperCase(), logoUrl: data.logoUrl || null },
    });
    revalidatePath("/admin/airlines");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateAirline(id: number, data: { name: string; code: string; logoUrl?: string }) {
  try {
    await requireRole([Role.ADMIN]);

    const existing = await prisma.airline.findFirst({ where: { code: data.code.toUpperCase(), NOT: { id } } });
    if (existing) throw new Error("KODE_ALREADY_EXISTS");

    await prisma.airline.update({
      where: { id },
      data: { name: data.name, code: data.code.toUpperCase(), logoUrl: data.logoUrl || null },
    });
    revalidatePath("/admin/airlines");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteAirline(id: number) {
  try {
    await requireRole([Role.ADMIN]);

    await prisma.airline.delete({ where: { id } });
    revalidatePath("/admin/airlines");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}
