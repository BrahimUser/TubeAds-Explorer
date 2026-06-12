-- AlterTable
ALTER TABLE `chat_messages` MODIFY `text` TEXT NULL;

-- AlterTable
ALTER TABLE `chat_threads` MODIFY `last_message_text` TEXT NULL;

-- AlterTable
ALTER TABLE `listings` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `order_delivery` MODIFY `notes` TEXT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `shop_description` TEXT NULL;
