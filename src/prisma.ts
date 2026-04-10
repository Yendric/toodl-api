import { PrismaClient } from "@prisma/client";
import { DatabaseLimitError } from "./errors/DatabaseLimitError";

const prisma = new PrismaClient().$extends({
  query: {
    list: {
      // BeforeCreate lijst: max 10 lijsten
      async create({ args, query }) {
        const amount = await prisma.list.count({
          where: {
            userId: args.data.userId,
          },
        });
        if (amount >= 10) {
          throw new DatabaseLimitError("Je mag maximaal 10 lijsten hebben.");
        }

        return query(args);
      },
      // BeforeDelete lijst: min 1 lijst
      async delete({ args, query }) {
        const amount = await prisma.list.count({
          where: {
            userId: args.where.userId,
          },
        });
        if (amount <= 1) {
          throw new DatabaseLimitError("Je moet minimaal 1 lijst hebben.");
        }

        return query(args);
      },
    },
    todo: {
      // BeforeCreate todo: max 100 todos per lijst
      async create({ args, query }) {
        const amount = await prisma.todo.count({
          where: {
            listId: args.data.listId,
          },
        });
        if (amount >= 100) {
          throw new DatabaseLimitError("Je kan maximaal 100 todos per lijst hebben.");
        }

        return query(args);
      },
    },
  },
});

export default prisma;
