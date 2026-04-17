import prisma from "#/prisma.js";
import { generateKeyBetween } from "fractional-indexing";

async function main() {
  console.log("Starting position migration...");

  const users = await prisma.user.findMany({
    select: { id: true },
  });

  for (const user of users) {
    const lists = await prisma.list.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    // Also migrate todos without a list
    const listIds: (number | null)[] = [...lists.map((l) => l.id), null];

    for (const listId of listIds) {
      const todos = await prisma.todo.findMany({
        where: { userId: user.id, listId },
        orderBy: { createdAt: "asc" },
      });

      let lastPosition: string | null = null;

      for (const todo of todos) {
        if (!todo.position) {
          const newPosition = generateKeyBetween(lastPosition, null);
          await prisma.todo.update({
            where: { id: todo.id },
            data: { position: newPosition },
          });
          lastPosition = newPosition;
        } else {
          lastPosition = todo.position;
        }
      }
    }
  }

  console.log("Position migration completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
