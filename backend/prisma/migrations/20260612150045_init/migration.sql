-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(255) NOT NULL DEFAULT '',
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `is_pro` BOOLEAN NOT NULL DEFAULT false,
    `shop_name` VARCHAR(255) NOT NULL DEFAULT '',
    `shop_logo_url` VARCHAR(512) NOT NULL DEFAULT '',
    `shop_description` TEXT NOT NULL,
    `auth_provider` VARCHAR(50) NOT NULL DEFAULT 'phone_password',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_phone_number_key`(`phone_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    INDEX `refresh_tokens_token_hash_idx`(`token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listings` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NOT NULL,
    `price_cents` INTEGER NOT NULL DEFAULT 0,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'MAD',
    `category` VARCHAR(100) NOT NULL DEFAULT '',
    `city` VARCHAR(50) NOT NULL DEFAULT '',
    `youtube_video_id` VARCHAR(20) NOT NULL DEFAULT '',
    `video_url` VARCHAR(512) NOT NULL DEFAULT '',
    `thumbnail_url` VARCHAR(512) NOT NULL DEFAULT '',
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE') NOT NULL DEFAULT 'PENDING',
    `view_count` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `listings_status_created_at_idx`(`status`, `created_at` DESC),
    INDEX `listings_owner_id_created_at_idx`(`owner_id`, `created_at` DESC),
    INDEX `listings_category_idx`(`category`),
    INDEX `listings_city_idx`(`city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listing_images` (
    `id` VARCHAR(191) NOT NULL,
    `listing_id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(512) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `listing_images_listing_id_sort_order_idx`(`listing_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `listing_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(500) NOT NULL DEFAULT '',
    `price_cents` INTEGER NOT NULL DEFAULT 0,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'MAD',
    `thumbnail_url` VARCHAR(512) NOT NULL DEFAULT '',
    `city` VARCHAR(50) NOT NULL DEFAULT '',
    `owner_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `favorites_user_id_idx`(`user_id`),
    UNIQUE INDEX `favorites_user_id_listing_id_key`(`user_id`, `listing_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_threads` (
    `id` VARCHAR(191) NOT NULL,
    `listing_id` VARCHAR(191) NOT NULL,
    `buyer_id` VARCHAR(191) NOT NULL,
    `seller_id` VARCHAR(191) NOT NULL,
    `product_title` VARCHAR(500) NOT NULL DEFAULT '',
    `product_thumb` VARCHAR(512) NOT NULL DEFAULT '',
    `price_label` VARCHAR(100) NOT NULL DEFAULT '',
    `last_message_text` TEXT NOT NULL,
    `last_message_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `chat_threads_buyer_id_created_at_idx`(`buyer_id`, `created_at` DESC),
    INDEX `chat_threads_seller_id_created_at_idx`(`seller_id`, `created_at` DESC),
    UNIQUE INDEX `chat_threads_listing_id_buyer_id_key`(`listing_id`, `buyer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_thread_participants` (
    `thread_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,

    INDEX `chat_thread_participants_user_id_idx`(`user_id`),
    PRIMARY KEY (`thread_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `thread_id` VARCHAR(191) NOT NULL,
    `sender_id` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `image_url` VARCHAR(512) NULL,
    `listing_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_messages_thread_id_created_at_idx`(`thread_id`, `created_at` ASC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `recipient_id` VARCHAR(191) NOT NULL,
    `sender_name` VARCHAR(255) NOT NULL DEFAULT '',
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) NOT NULL DEFAULT 'generic',
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `link` JSON NULL,
    `read_at` DATETIME(3) NULL,
    `read_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_recipient_id_is_read_idx`(`recipient_id`, `is_read`),
    INDEX `notifications_recipient_id_created_at_idx`(`recipient_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `order_number` VARCHAR(20) NOT NULL,
    `buyer_id` VARCHAR(191) NOT NULL,
    `seller_id` VARCHAR(191) NOT NULL,
    `listing_id` VARCHAR(191) NOT NULL,
    `listing_title` VARCHAR(500) NOT NULL DEFAULT '',
    `listing_thumbnail_url` VARCHAR(512) NOT NULL DEFAULT '',
    `price_cents` INTEGER NOT NULL DEFAULT 0,
    `subtotal_cents` INTEGER NOT NULL DEFAULT 0,
    `shipping_fee_cents` INTEGER NOT NULL DEFAULT 0,
    `total_cents` INTEGER NOT NULL DEFAULT 0,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'MAD',
    `delivery_method` ENUM('HOME', 'PICKUP') NOT NULL DEFAULT 'HOME',
    `payment_method` ENUM('CASH', 'CARD') NOT NULL DEFAULT 'CASH',
    `status` ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_number_key`(`order_number`),
    INDEX `orders_seller_id_created_at_idx`(`seller_id`, `created_at` DESC),
    INDEX `orders_buyer_id_created_at_idx`(`buyer_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_delivery` (
    `order_id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL DEFAULT '',
    `phone` VARCHAR(20) NOT NULL DEFAULT '',
    `address` VARCHAR(500) NOT NULL DEFAULT '',
    `city` VARCHAR(100) NOT NULL DEFAULT '',
    `zip` VARCHAR(20) NOT NULL DEFAULT '',
    `notes` TEXT NOT NULL,

    PRIMARY KEY (`order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `uploads` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `size_bytes` INTEGER NOT NULL,
    `storage_path` VARCHAR(512) NOT NULL,
    `public_url` VARCHAR(512) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `uploads_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listings` ADD CONSTRAINT `listings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_images` ADD CONSTRAINT `listing_images_listing_id_fkey` FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_listing_id_fkey` FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_threads` ADD CONSTRAINT `chat_threads_listing_id_fkey` FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_threads` ADD CONSTRAINT `chat_threads_buyer_id_fkey` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_threads` ADD CONSTRAINT `chat_threads_seller_id_fkey` FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_thread_participants` ADD CONSTRAINT `chat_thread_participants_thread_id_fkey` FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_thread_participants` ADD CONSTRAINT `chat_thread_participants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_thread_id_fkey` FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_listing_id_fkey` FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipient_id_fkey` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_read_by_fkey` FOREIGN KEY (`read_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_buyer_id_fkey` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_seller_id_fkey` FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_listing_id_fkey` FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_delivery` ADD CONSTRAINT `order_delivery_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `uploads` ADD CONSTRAINT `uploads_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
