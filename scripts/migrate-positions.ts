import { PrismaClient } from "@prisma/client";
import { generateKeyBetween } from "fractional-indexing";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting position migration...");

  // Get all unique users and lists
  const todos = await prisma.todo.findMany({
    select: { id: true, userId: true, listId: true },
    orderBy: [{ done: "asc" }, { startTime: "asc" }, { id: "asc" }],
  });

  const groups: Record<string, number[]> = {};

  for (const todo of todos) {
    const key = `${todo.userId}-${todo.listId || "inbox"}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(todo.id);
  }

  let totalUpdated = 0;

  for (const [, todoIds] of Object.entries(groups)) {
    let currentPosition: string | null = null;
    for (const todoId of todoIds) {
      currentPosition = generateKeyBetween(currentPosition, null);
      await prisma.todo.update({
        where: { id: todoId },
        data: { position: currentPosition },
      });
      totalUpdated++;
    }
  }

  console.log(`Successfully updated positions for ${totalUpdated} todos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
