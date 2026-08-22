CREATE TABLE `reel_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reelId` int NOT NULL,
	`assetType` enum('research','script','captions','voice','video','thumbnail','metadata') NOT NULL,
	`storageProvider` enum('drive','project_storage') NOT NULL,
	`storageReference` text NOT NULL,
	`verificationStatus` enum('pending','verified','failed') NOT NULL DEFAULT 'pending',
	`verificationNote` text,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reel_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reel_catalog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reelNumber` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`topic` varchar(255) NOT NULL,
	`status` enum('research_ready','script_ready','media_blocked','qc_pending','qc_passed','uploaded','failed') NOT NULL DEFAULT 'research_ready',
	`evidenceSummary` text NOT NULL,
	`scriptText` text NOT NULL,
	`captionText` text NOT NULL,
	`visualPlan` text NOT NULL,
	`driveFolderId` varchar(128),
	`sourceRecordPath` varchar(512) NOT NULL,
	`lastBlocker` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reel_catalog_id` PRIMARY KEY(`id`)
);
