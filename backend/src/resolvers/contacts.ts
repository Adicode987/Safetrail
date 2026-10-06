import { GraphQLError } from "graphql";
import { Context, requireAuth } from "../context";

export const contactResolvers = {
  Query: {
    contacts: async (_: unknown, __: unknown, context: Context) => {
      const userId = requireAuth(context);

      const contacts = await context.prisma.contact.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });

      return contacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
      }));
    },
  },

  Mutation: {
    addContact: async (
      _: unknown,
      args: { input: { name: string; email: string; phone?: string } },
      context: Context
    ) => {
      const userId = requireAuth(context);

      const count = await context.prisma.contact.count({ where: { userId } });
      if (count >= 5) {
        throw new GraphQLError("Maximum 5 contacts allowed");
      }

      const email = args.input.email.trim().toLowerCase();
      const name = args.input.name.trim();

      const contact = await context.prisma.contact.create({
        data: { userId, name, email, phone: args.input.phone || null },
      });

      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      };
    },

    removeContact: async (
      _: unknown,
      args: { id: string },
      context: Context
    ) => {
      const userId = requireAuth(context);

      const contact = await context.prisma.contact.findUnique({
        where: { id: args.id },
      });

      if (!contact || contact.userId !== userId) {
        throw new GraphQLError("Contact not found");
      }

      await context.prisma.contact.delete({ where: { id: args.id } });
      return true;
    },
  },
};
