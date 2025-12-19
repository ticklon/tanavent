-- packages/shared/drizzle/0000_init.sql

CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);

CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`plan` text DEFAULT 'free',
	`stripe_customer_id` text,
	`created_at` integer NOT NULL
);

CREATE TABLE `section` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade ON UPDATE no action,
	`name` text NOT NULL,
	`settings` text DEFAULT '{}'
);

CREATE TABLE `member` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade ON UPDATE no action,
	`user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` integer NOT NULL
);

CREATE TABLE `member_section` (
	`member_id` text NOT NULL REFERENCES `member`(`id`) ON DELETE cascade ON UPDATE no action,
	`section_id` text NOT NULL REFERENCES `section`(`id`) ON DELETE cascade ON UPDATE no action,
	PRIMARY KEY(`member_id`, `section_id`)
);

CREATE TABLE `invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade ON UPDATE no action,
	`role` text DEFAULT 'member',
	`expires_at` integer NOT NULL,
	`status` text DEFAULT 'active'
);

CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
	`section_id` text NOT NULL REFERENCES `section`(`id`) ON DELETE cascade,
	`name` text NOT NULL,
	`display_order` integer DEFAULT 0
);

CREATE TABLE `supplier` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
	`section_id` text NOT NULL REFERENCES `section`(`id`) ON DELETE cascade,
	`name` text NOT NULL,
	`contact_info` text
);

CREATE TABLE `item` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade ON UPDATE no action,
	`section_id` text NOT NULL REFERENCES `section`(`id`) ON DELETE cascade ON UPDATE no action,
	`category_id` text REFERENCES `category`(`id`) ON DELETE set null,
	`supplier_id` text REFERENCES `supplier`(`id`) ON DELETE set null,
	`name` text NOT NULL,
	`sub_name` text,
	`vintage` integer,
	`quantity` real DEFAULT 0 NOT NULL,
	`unit` text DEFAULT 'pc',
	`last_cost_price` integer DEFAULT 0,
	`min_stock_level` real DEFAULT 0,
	`updated_at` integer NOT NULL
);

CREATE TABLE `purchase_order` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
	`supplier_id` text NOT NULL REFERENCES `supplier`(`id`),
	`date` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`total_amount` integer DEFAULT 0,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE `purchase_item` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_order_id` text NOT NULL REFERENCES `purchase_order`(`id`) ON DELETE cascade,
	`item_id` text NOT NULL REFERENCES `item`(`id`),
	`quantity` real NOT NULL,
	`cost_price` integer NOT NULL,
	`received_quantity` real
);

CREATE TABLE `stocktake_session` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
	`section_id` text NOT NULL REFERENCES `section`(`id`) ON DELETE cascade,
	`name` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`started_at` integer NOT NULL,
	`closed_at` integer
);

CREATE TABLE `stocktake_record` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL REFERENCES `stocktake_session`(`id`) ON DELETE cascade,
	`item_id` text NOT NULL REFERENCES `item`(`id`),
	`expected_quantity` real NOT NULL,
	`actual_quantity` real NOT NULL,
	`diff_quantity` real GENERATED ALWAYS AS (actual_quantity - expected_quantity) VIRTUAL,
	`updated_at` integer NOT NULL
);

CREATE TABLE `daily_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL REFERENCES `organization`(`id`) ON DELETE cascade,
	`section_id` text NOT NULL REFERENCES `section`(`id`) ON DELETE cascade,
	`date` integer NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`customer_count` integer DEFAULT 0,
	`note` text
);
