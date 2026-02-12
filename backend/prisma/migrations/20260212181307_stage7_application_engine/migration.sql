/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Application` table. All the data in the column will be lost.
  - The `status` column on the `Application` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[driveId,studentId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[applicationId]` on the table `DriveStudent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `collegeId` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'IN_TEST', 'SHORTLISTED', 'IN_INTERVIEW', 'SELECTED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_driveId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_studentId_fkey";

-- DropForeignKey
ALTER TABLE "DriveStudent" DROP CONSTRAINT "DriveStudent_collegeId_fkey";

-- DropForeignKey
ALTER TABLE "DriveStudent" DROP CONSTRAINT "DriveStudent_driveId_fkey";

-- DropForeignKey
ALTER TABLE "DriveStudent" DROP CONSTRAINT "DriveStudent_studentId_fkey";

-- DropIndex
DROP INDEX "Application_studentId_driveId_key";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "createdAt",
ADD COLUMN     "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "collegeId" TEXT NOT NULL,
ADD COLUMN     "currentStage" TEXT NOT NULL DEFAULT 'APPLICATIONS',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED';

-- AlterTable
ALTER TABLE "DriveStudent" ADD COLUMN     "applicationId" TEXT;

-- CreateIndex
CREATE INDEX "Application_collegeId_idx" ON "Application"("collegeId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_currentStage_idx" ON "Application"("currentStage");

-- CreateIndex
CREATE UNIQUE INDEX "Application_driveId_studentId_key" ON "Application"("driveId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "DriveStudent_applicationId_key" ON "DriveStudent"("applicationId");

-- CreateIndex
CREATE INDEX "DriveStudent_driveId_idx" ON "DriveStudent"("driveId");

-- CreateIndex
CREATE INDEX "DriveStudent_collegeId_idx" ON "DriveStudent"("collegeId");

-- AddForeignKey
ALTER TABLE "DriveStudent" ADD CONSTRAINT "DriveStudent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveStudent" ADD CONSTRAINT "DriveStudent_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveStudent" ADD CONSTRAINT "DriveStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveStudent" ADD CONSTRAINT "DriveStudent_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
