/*
  Warnings:

  - Added the required column `fileName` to the `FileUpload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSize` to the `FileUpload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `FileUpload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedByUserId` to the `FileUpload` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FileUpload" ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "fileSize" INTEGER NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "uploadedByUserId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "FileUpload_uploadedByUserId_idx" ON "FileUpload"("uploadedByUserId");

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
