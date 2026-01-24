-- AlterTable
ALTER TABLE `Account` MODIFY `refresh_token` TEXT NULL,
    MODIFY `access_token` TEXT NULL,
    MODIFY `id_token` TEXT NULL;

-- AlterTable
ALTER TABLE `Business` ADD COLUMN `planId` VARCHAR(191) NULL,
    ADD COLUMN `subscriptionEndsAt` DATETIME(3) NULL,
    ADD COLUMN `subscriptionStatus` ENUM('TRIAL', 'ACTIVE', 'EXPIRED', 'PAUSED') NOT NULL DEFAULT 'TRIAL',
    ADD COLUMN `trialEndsAt` DATETIME(3) NULL,
    MODIFY `type` ENUM('POS', 'RETAIL', 'CORPORATE', 'PERSONAL', 'SME') NULL;

-- AlterTable
ALTER TABLE `Membership` MODIFY `role` ENUM('OWNER', 'AGENT', 'MANAGER', 'ACCOUNTANT', 'AUDITOR', 'FINANCE_OFFICER', 'SUPERADMIN', 'SUPPORT') NOT NULL;

-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `category` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('OWNER', 'AGENT', 'MANAGER', 'ACCOUNTANT', 'AUDITOR', 'FINANCE_OFFICER', 'SUPERADMIN', 'SUPPORT') NOT NULL DEFAULT 'AGENT';

-- CreateTable
CREATE TABLE `PricingPlan` (
    `id` VARCHAR(191) NOT NULL,
    `businessType` ENUM('POS', 'RETAIL', 'CORPORATE', 'PERSONAL', 'SME') NOT NULL,
    `monthlyPrice` DOUBLE NOT NULL DEFAULT 0,
    `trialDays` INTEGER NOT NULL DEFAULT 30,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PricingPlan_businessType_key`(`businessType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GatewayTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(191) NULL DEFAULT 'NGN',
    `product` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `purpose` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `authorizationUrl` VARCHAR(191) NULL,
    `paystackResponse` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `paidAt` DATETIME(3) NULL,

    UNIQUE INDEX `GatewayTransaction_reference_key`(`reference`),
    INDEX `GatewayTransaction_reference_idx`(`reference`),
    INDEX `GatewayTransaction_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Business_planId_fkey` ON `Business`(`planId`);

-- AddForeignKey
ALTER TABLE `Business` ADD CONSTRAINT `Business_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `PricingPlan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
