-- CreateTable
CREATE TABLE `CashAdvance` (
    `id` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `businessId` VARCHAR(191) NOT NULL,
    `givenById` VARCHAR(191) NOT NULL,
    `receivedById` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `confirmedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CashAdvance` ADD CONSTRAINT `CashAdvance_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashAdvance` ADD CONSTRAINT `CashAdvance_givenById_fkey` FOREIGN KEY (`givenById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashAdvance` ADD CONSTRAINT `CashAdvance_receivedById_fkey` FOREIGN KEY (`receivedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
