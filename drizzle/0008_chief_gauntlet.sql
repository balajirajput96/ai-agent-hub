CREATE TABLE `reel_production_controls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetReels` int NOT NULL DEFAULT 3000,
	`batchSize` int NOT NULL DEFAULT 30,
	`currentBatchNumber` int NOT NULL DEFAULT 1,
	`nextReelNumber` int NOT NULL DEFAULT 1,
	`completedReels` int NOT NULL DEFAULT 0,
	`researchReadyReels` int NOT NULL DEFAULT 0,
	`mediaBlockedReels` int NOT NULL DEFAULT 0,
	`retryQueuedReels` int NOT NULL DEFAULT 0,
	`currentCapacityBoundary` text,
	`masterProgressDriveFileId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reel_production_controls_id` PRIMARY KEY(`id`),
	CONSTRAINT `reel_production_controls_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `reel_research_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topic` varchar(255) NOT NULL,
	`subtopic` varchar(255),
	`finding` text NOT NULL,
	`evidenceClass` enum('established_evidence','strong_evidence','emerging_evidence','mixed_evidence','preliminary_finding','expert_interpretation','philosophical_concept','spiritual_traditional_belief') NOT NULL,
	`sourceTitle` text NOT NULL,
	`sourceUrl` varchar(1024) NOT NULL,
	`limitations` text NOT NULL,
	`usageStatus` enum('unused','assigned','used') NOT NULL DEFAULT 'unused',
	`assignedReelId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reel_research_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reel_retry_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reelId` int NOT NULL,
	`pipelineStage` enum('research','verify','script','voice','visuals','render','qc','upload') NOT NULL,
	`status` enum('queued','in_progress','resolved') NOT NULL DEFAULT 'queued',
	`attemptCount` int NOT NULL DEFAULT 0,
	`failureCategory` varchar(128) NOT NULL,
	`errorSummary` text NOT NULL,
	`nextRecommendedAction` text NOT NULL,
	`nextAttemptAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reel_retry_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reel_catalog` ADD `batchNumber` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `reel_catalog` ADD `uniqueKey` varchar(255);--> statement-breakpoint
ALTER TABLE `reel_catalog` ADD `evidenceClass` enum('established_evidence','strong_evidence','emerging_evidence','mixed_evidence','preliminary_finding','expert_interpretation','philosophical_concept','spiritual_traditional_belief') DEFAULT 'established_evidence' NOT NULL;--> statement-breakpoint
ALTER TABLE `reel_catalog` ADD `expectedDurationSeconds` int DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE `reel_catalog` ADD CONSTRAINT `reel_catalog_user_unique_key` UNIQUE(`userId`,`uniqueKey`);