"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

export async function getUsers() {
  await requireRole([Role.ADMIN]);
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });
}

export async function createUser(formData: FormData) {
  await requireRole([Role.ADMIN]);

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as Role;

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      isVerified: true,
    },
  });

  revalidatePath("/admin/users");
}

export async function updateUser(formData: FormData) {
  await requireRole([Role.ADMIN]);

  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as Role;
  const password = formData.get("password") as string;

  const data: any = { name, email, role };
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/users");
}

export async function deleteUser(formData: FormData) {
  const session = await requireRole([Role.ADMIN]);

  const id = Number(formData.get("id"));
  
  // Cegah admin menghapus dirinya sendiri
  if (id === session.userId) {
    throw new Error("CANNOT_DELETE_SELF");
  }

  await prisma.user.delete({
    where: { id },
  });

  revalidatePath("/admin/users");
}