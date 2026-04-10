import { ListService } from "@/services/ListService";
import prisma from "@/prisma";
import { DatabaseLimitError } from "@/errors/DatabaseLimitError";

jest.mock("@/prisma", () => ({
  list: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
}));

describe("ListService", () => {
  let listService: ListService;

  beforeEach(() => {
    jest.clearAllMocks();
    listService = new ListService();
  });

  describe("create", () => {
    it("should create a list if under limit", async () => {
      (prisma.list.count as jest.Mock).mockResolvedValue(5);
      (prisma.list.create as jest.Mock).mockResolvedValue({ id: 1, name: "Test List" });

      const result = await listService.create(1, { name: "Test List", color: "#ffffff" });

      expect(prisma.list.count).toHaveBeenCalled();
      expect(prisma.list.create).toHaveBeenCalled();
      expect(result.name).toBe("Test List");
    });

    it("should throw error if at max limit", async () => {
      (prisma.list.count as jest.Mock).mockResolvedValue(10);

      await expect(listService.create(1, { name: "Too many", color: "#000" }))
        .rejects.toThrow(DatabaseLimitError);
    });
  });

  describe("delete", () => {
    it("should delete a list if more than one exists", async () => {
      (prisma.list.count as jest.Mock).mockResolvedValue(2);
      (prisma.list.delete as jest.Mock).mockResolvedValue({ id: 1 });

      await listService.delete(1, 1);

      expect(prisma.list.delete).toHaveBeenCalled();
    });

    it("should throw error if only one list remains", async () => {
      (prisma.list.count as jest.Mock).mockResolvedValue(1);

      await expect(listService.delete(1, 1))
        .rejects.toThrow(DatabaseLimitError);
    });
  });
});
