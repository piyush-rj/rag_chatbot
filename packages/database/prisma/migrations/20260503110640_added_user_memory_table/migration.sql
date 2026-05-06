/*
  Warnings:

  - You are about to drop the column `name` on the `UserMemory` table. All the data in the column will be lost.
  - Added the required column `fact` to the `UserMemory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `UserMemory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserMemory" DROP COLUMN "name",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fact" TEXT NOT NULL,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "UserMemory_userId_idx" ON "UserMemory"("userId");

-- AddForeignKey
ALTER TABLE "UserMemory" ADD CONSTRAINT "UserMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
