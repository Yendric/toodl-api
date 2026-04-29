import * as dmmf from "#/generated/dmmf.js";
import createPrismaMock from "prisma-mock/client";
import { beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

process.env.RESEND_API_KEY = "re_test_123";

vi.mock("#/prisma.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#/prisma.js")>();
  return {
    ...actual,
    default: mockDeep(),
  };
});

import prisma from "#/prisma.js";
import { Prisma } from "../src/generated/prisma/client.js";

beforeEach(() => {
  mockReset(prisma);
  /** @ts-expect-error Weird type bug */
  createPrismaMock(Prisma, { datamodel: dmmf, mockClient: prisma });
});
