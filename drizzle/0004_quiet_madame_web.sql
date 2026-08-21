CREATE TABLE `daily_report_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reportType` varchar(100) NOT NULL,
	`sourceScope` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'delivered',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_report_history_id` PRIMARY KEY(`id`)
);
