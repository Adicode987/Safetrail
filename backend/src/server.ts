import "dotenv/config";
import { createServer } from "node:http";
import { createYoga, createSchema } from "graphql-yoga";
import { typeDefs } from "./typeDefs";
import { createContext, Context, prisma } from "./context";
import { authResolvers } from "./resolvers/auth";
import { contactResolvers } from "./resolvers/contacts";
import { sosResolvers } from "./resolvers/sos";
import { journeyResolvers } from "./resolvers/journey";
import { startTimer } from "./timer";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

const schema = createSchema<Context>({
  typeDefs,
  resolvers: {
    Query: {
      health: () => "ok",
      ...authResolvers.Query,
      ...contactResolvers.Query,
      ...sosResolvers.Query,
      ...journeyResolvers.Query,
    },
    Mutation: {
      ...authResolvers.Mutation,
      ...contactResolvers.Mutation,
      ...sosResolvers.Mutation,
      ...journeyResolvers.Mutation,
    },
  },
});

const yoga = createYoga({
  schema,
  context: createContext,
  cors: {
    origin: "*",
    credentials: true,
  },
});

const server = createServer(yoga);

server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${port}/graphql`);
  startTimer(prisma);
});
