-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `recipientId` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `user` MODIFY `email` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
