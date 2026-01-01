-- AlterTable
ALTER TABLE `business` ADD COLUMN `type` ENUM('POS', 'RETAIL', 'CORPORATE', 'PERSONAL') NOT NULL DEFAULT 'POS';

-- AlterTable
ALTER TABLE `financialaccount` ADD COLUMN `holderId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `membership` MODIFY `role` ENUM('OWNER', 'AGENT', 'MANAGER', 'ACCOUNTANT', 'AUDITOR', 'FINANCE_OFFICER') NOT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('OWNER', 'AGENT', 'MANAGER', 'ACCOUNTANT', 'AUDITOR', 'FINANCE_OFFICER') NOT NULL DEFAULT 'AGENT';

-- CreateTable
CREATE TABLE `Request` (
    `id` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `type` ENUM('CASH_ADVANCE', 'EXPENSE_REIMBURSEMENT') NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `description` VARCHAR(191) NULL,
    `requesterId` VARCHAR(191) NOT NULL,
    `approverId` VARCHAR(191) NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FinancialAccount` ADD CONSTRAINT `FinancialAccount_holderId_fkey` FOREIGN KEY (`holderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
