import { PrismaClient } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing");
}

const JWT_SECRET = process.env.JWT_SECRET;

export const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  userId: string | null;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export function requireAuth(context: Context): string {
  if (!context.userId) {
    throw new GraphQLError("UNAUTHENTICATED");
  }
  return context.userId;
}

export async function createContext({
  request,
}: {
  request: Request;
}): Promise<Context> {
  let userId: string | null = null;
  const authHeader = request.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      userId = verifyToken(token);
    }
  }

  return { prisma, userId };
}
