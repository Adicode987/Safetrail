-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('SENT', 'FAILED');

-- DropTable
DROP TABLE "AlertDelivery";

-- DropEnum
DROP TYPE "AlertChannel";

-- DropEnum
DROP TYPE "DeliveryStatus";

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN "recipients" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "Alert" ALTER COLUMN "recipients" DROP DEFAULT;

ALTER TABLE "Alert" ADD COLUMN "status" "AlertStatus" NOT NULL DEFAULT 'SENT';
