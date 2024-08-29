
-- AlterTable
ALTER TABLE "Todo" ADD COLUMN "enableDeadline" BOOLEAN;

-- AlterTable
ALTER TABLE "Todo" ALTER COLUMN "enableDeadline" SET DEFAULT false;

-- Data migration
UPDATE
    "Todo"
SET
    "enableDeadline" = EXISTS (
        SELECT
            "id"
        FROM
            "List"
        WHERE
            "List"."id" = "Todo"."listId"
            AND "List"."withoutDates" = FALSE
    );

-- AlterTable
ALTER TABLE "List" DROP COLUMN "withoutDates";
