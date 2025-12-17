CREATE TABLE `invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`role` text DEFAULT 'member',
	`expires_at` integer NOT NULL,
	`status` text DEFAULT 'active',
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `member_section` (
	`member_id` text NOT NULL,
	`section_id` text NOT NULL,
	PRIMARY KEY(`member_id`, `section_id`),
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `section`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`plan` text DEFAULT 'free',
	`stripe_customer_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `section` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`settings` text DEFAULT '{}',
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_preference` (
	`user_id` text PRIMARY KEY NOT NULL,
	`active_organization_id` text,
	`active_section_id` text,
	`language` text DEFAULT 'ja',
	`last_view_state` text DEFAULT '{"view": "dashboard"}',
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`section_id` text NOT NULL,
	`name` text NOT NULL,
	`display_order` integer DEFAULT 0,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `section`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `daily_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`section_id` text NOT NULL,
	`date` integer NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`customer_count` integer DEFAULT 0,
	`note` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `section`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `item` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`section_id` text NOT NULL,
	`category_id` text,
	`supplier_id` text,
	`name` text NOT NULL,
	`sub_name` text,
	`vintage` integer,
	`unit` text DEFAULT 'pc',
	`quantity` real DEFAULT 0 NOT NULL,
	`last_cost_price` integer DEFAULT 0,
	`min_stock_level` real DEFAULT 0,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `section`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `purchase_item` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_order_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` real NOT NULL,
	`cost_price` integer NOT NULL,
	`received_quantity` real,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_order` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`supplier_id` text NOT NULL,
	`date` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`total_amount` integer DEFAULT 0,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stocktake_record` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`item_id` text NOT NULL,
	`expected_quantity` real NOT NULL,
	`actual_quantity` real NOT NULL,
	`diff_quantity` real GENERATED ALWAYS AS (actual_quantity - expected_quantity) VIRTUAL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `stocktake_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stocktake_session` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`section_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`started_at` integer NOT NULL,
	`closed_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `section`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `supplier` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`section_id` text NOT NULL,
	`name` text NOT NULL,
	`contact_info` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `section`(`id`) ON UPDATE no action ON DELETE cascade
);
