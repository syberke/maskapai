import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type SessionPayload = {
  userId: number;
  email: string;
  role: Role;
};

export function getJwtSecret() {
  return process.env.JWT_SECRET || "SUPER_SECRET_RENGGO_MASKAPAI_BAZMA";
}

export async function getSessionFromCookie() {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await getSessionFromCookie();

  if (!session || !allowedRoles.includes(session.role)) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}
