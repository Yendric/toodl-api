import { PrismaClient } from "@prisma/client";
import { DatabaseLimitError } from "./errors/DatabaseLimitError";

import dayjs from "dayjs";
import { ToodlError } from "./errors/ToodlError";

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
    user: {
      // AfterCreate user: maak standaardlijsten aan
      async create({ args, query }) {
        const createdUser = await query(args);

        if (!createdUser.id) {
          throw new ToodlError("Fout bij het maken van de standaardlijst", "DatabaseError");
        }

        const boodschappen = await prisma.list.create({
          data: {
            userId: createdUser.id,
            name: "Boodschappen",
            color: "#33AAFF",
            withoutDates: true,
          },
        });

        await prisma.todo.create({
          data: {
            userId: createdUser.id,
            listId: boodschappen.id,
            subject: "Klik op de checkbox om de todo als klaar te markeren",
          },
        });

        await prisma.todo.create({
          data: {
            userId: createdUser.id,
            listId: boodschappen.id,
            startTime: new Date(),
            endTime: dayjs(new Date()).add(1, "hour").toDate(),
            subject: "Maak extra lijstjes met behulp van de linker zijbalk",
          },
        });

        const planning = await prisma.list.create({
          data: {
            userId: createdUser.id,
            name: "Planning",
            color: "#FF0000",
            withoutDates: false,
          },
        });

        await prisma.todo.create({
          data: {
            userId: createdUser.id,
            listId: planning.id,
            startTime: new Date(),
            endTime: dayjs(new Date()).add(1, "hour").toDate(),
            subject: "Maak todos met datum & tijd en bekijk ze in de planningweergave bovenaan",
          },
        });

        return createdUser;
      },
    },
  },
});

export default prisma;
