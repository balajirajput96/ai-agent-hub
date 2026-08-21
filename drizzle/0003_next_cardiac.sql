CREATE TABLE `fb_action_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`actionType` varchar(64) NOT NULL,
	`description` text NOT NULL,
	`proposedContent` text NOT NULL,
	`status` varchar(64) NOT NULL DEFAULT 'pending_approval',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fb_action_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fb_audit_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`stepTitle` varchar(255) NOT NULL,
	`status` varchar(64) NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fb_audit_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fb_certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`originalTitle` text NOT NULL,
	`translatedTitle` text NOT NULL,
	`sourcePlatform` varchar(64) DEFAULT 'Coursera',
	`isRelevant` boolean NOT NULL DEFAULT true,
	`isDisplayed` boolean NOT NULL DEFAULT true,
	`duplicateOf` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fb_certificates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fb_privacy_checklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`itemTitle` text NOT NULL,
	`description` text NOT NULL,
	`recommendedSetting` varchar(128) NOT NULL,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fb_privacy_checklist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fb_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` text,
	`profileUrl` text,
	`currentBio` text,
	`proposedBio` text,
	`targetPositioning` text,
	`avatarStatus` varchar(64) DEFAULT 'needs_review',
	`coverStatus` varchar(64) DEFAULT 'needs_review',
	`privacyStatus` varchar(64) DEFAULT 'review_pending',
	`overallStatus` varchar(64) DEFAULT 'auditing',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fb_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fb_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`skillName` varchar(128) NOT NULL,
	`category` varchar(64) DEFAULT 'Technical',
	`isHighlighted` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fb_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fb_verified_facts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`factCategory` varchar(64) NOT NULL,
	`factTitle` text NOT NULL,
	`factDetails` text NOT NULL,
	`sourceDocument` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fb_verified_facts_id` PRIMARY KEY(`id`)
);
