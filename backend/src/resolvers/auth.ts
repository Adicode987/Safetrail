import { GraphQLError } from "graphql";
import * as bcrypt from "bcryptjs";
import { Context, signToken, requireAuth } from "../context";

export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, context: Context) => {
      if (!context.userId) {
        return null;
      }

      const user = await context.prisma.user.findUnique({
        where: { id: context.userId },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt.toISOString(),
      };
    },
  },

  Mutation: {
    signUp: async (
      _: unknown,
      args: { name: string; email: string; password: string; phone?: string },
      context: Context
    ) => {
      const email = args.email.trim().toLowerCase();
      const name = args.name.trim();

      if (args.password.length < 8) {
        throw new GraphQLError("Password must be at least 8 characters");
      }

      const existing = await context.prisma.user.findUnique({
        where: { email },
      });
      if (existing) {
        throw new GraphQLError("Email already in use");
      }

      const passwordHash = await bcrypt.hash(args.password, 10);

      const user = await context.prisma.user.create({
        data: { name, email, phone: args.phone || null, passwordHash },
      });

      return {
        token: signToken(user.id),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt.toISOString(),
        },
      };
    },

    login: async (
      _: unknown,
      args: { email: string; password: string },
      context: Context
    ) => {
      const email = args.email.trim().toLowerCase();

      const user = await context.prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        throw new GraphQLError("Invalid email or password");
      }

      const valid = await bcrypt.compare(args.password, user.passwordHash);
      if (!valid) {
        throw new GraphQLError("Invalid email or password");
      }

      return {
        token: signToken(user.id),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt.toISOString(),
        },
      };
    },
  },
};
