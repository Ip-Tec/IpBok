-- AlterTable
ALTER TABLE `transaction` MODIFY `paymentMethod` ENUM('ATM_CARD', 'BANK', 'BANK_TRANSFER', 'CASH', 'MOBILE_MONEY') NOT NULL;
