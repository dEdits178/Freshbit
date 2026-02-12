/*
  Warnings:

  - The values [NOT_STARTED] on the enum `StageStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `currentStage` column on the `Application` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `DriveStage` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StageType" AS ENUM ('APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL');

-- AlterEnum
BEGIN;
CREATE TYPE "StageStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED');
ALTER TABLE "Stage" ALTER COLUMN "status" TYPE "StageStatus_new" USING ("status"::text::"StageStatus_new");
ALTER TYPE "StageStatus" RENAME TO "StageStatus_old";
ALTER TYPE "StageStatus_new" RENAME TO "StageStatus";
DROP TYPE "StageStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "DriveStage" DROP CONSTRAINT "DriveStage_collegeId_fkey";

-- DropForeignKey
ALTER TABLE "DriveStage" DROP CONSTRAINT "DriveStage_driveId_fkey";

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "selectedAt" TIMESTAMP(3),
ADD COLUMN     "stageHistory" JSONB,
DROP COLUMN "currentStage",
ADD COLUMN     "currentStage" "StageType" NOT NULL DEFAULT 'APPLICATIONS';

-- AlterTable
ALTER TABLE "Drive" ADD COLUMN     "currentStage" "StageType" NOT NULL DEFAULT 'APPLICATIONS',
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "DriveStage";

-- DropEnum
DROP TYPE "StageName";

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "name" "StageType" NOT NULL,
    "status" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Stage_driveId_idx" ON "Stage"("driveId");

-- CreateIndex
CREATE INDEX "Stage_status_idx" ON "Stage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_driveId_name_key" ON "Stage"("driveId", "name");

-- CreateIndex
CREATE INDEX "Application_currentStage_idx" ON "Application"("currentStage");

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;
