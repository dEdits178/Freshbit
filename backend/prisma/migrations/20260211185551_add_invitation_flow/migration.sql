-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ManagedBy" AS ENUM ('COLLEGE', 'ADMIN');

-- AlterTable
ALTER TABLE "DriveCollege" ADD COLUMN     "invitationStatus" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "managedBy" "ManagedBy",
ADD COLUMN     "startedAt" TIMESTAMP(3);
