CREATE TABLE `continuation_controls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`isEnabled` boolean NOT NULL DEFAULT true,
	`maxCycles` int NOT NULL DEFAULT 2400,
	`completedCycles` int NOT NULL DEFAULT 0,
	`lastCycleAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `continuation_controls_id` PRIMARY KEY(`id`),
	CONSTRAINT `continuation_controls_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `continuation_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`controlId` int NOT NULL,
	`idempotencyKey` varchar(64) NOT NULL,
	`executionNumber` int NOT NULL,
	`triggeredByTaskUid` varchar(65) NOT NULL,
	`action` varchar(100) NOT NULL,
	`result` varchar(32) NOT NULL,
	`failureCategory` varchar(100),
	`recoveryAttempt` int NOT NULL DEFAULT 0,
	`validationStatus` varchar(100) NOT NULL,
	`remainingBlocker` text,
	`nextRecommendedAction` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `continuation_cycles_id` PRIMARY KEY(`id`),
	CONSTRAINT `continuation_cycles_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
