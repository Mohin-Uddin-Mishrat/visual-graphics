ALTER TABLE "ClientAsset"
ADD COLUMN "new_id" SERIAL;

UPDATE "ClientAsset" AS target
SET "new_id" = source.new_id
FROM (
    SELECT
        "id",
        ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS new_id
    FROM "ClientAsset"
) AS source
WHERE target."id" = source."id";

ALTER TABLE "ClientAsset" DROP CONSTRAINT "ClientAsset_pkey";
ALTER TABLE "ClientAsset" DROP COLUMN "id";
ALTER TABLE "ClientAsset" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "ClientAsset" ADD CONSTRAINT "ClientAsset_pkey" PRIMARY KEY ("id");

SELECT setval(
    pg_get_serial_sequence('"ClientAsset"', 'id'),
    COALESCE((SELECT MAX("id") FROM "ClientAsset"), 1),
    EXISTS (SELECT 1 FROM "ClientAsset")
);
