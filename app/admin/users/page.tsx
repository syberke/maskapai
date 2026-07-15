import prisma from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import UserClient from "./UserClient";

export default async function AdminUsersPage() {
  await connection();

  const session = await getSessionFromCookie();
  if (!session || session.role !== Role.ADMIN) redirect("/");

  const users = await prisma.user.findMany({
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

  return <UserClient users={users} currentUserId={session.userId} />;
}
