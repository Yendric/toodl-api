import prisma from "#/prisma.js";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
}
