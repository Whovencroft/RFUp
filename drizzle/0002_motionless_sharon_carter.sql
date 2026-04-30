CREATE TABLE `ai_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`authorType` enum('ai','player') NOT NULL,
	`authorId` int,
	`authorName` varchar(128) NOT NULL,
	`content` text NOT NULL,
	`rollData` text,
	`dcSet` int,
	`skillRuling` enum('approved','denied','partial'),
	`isIncidentChain` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`incitingIncidentId` int,
	`status` enum('active','ended') NOT NULL DEFAULT 'active',
	`playerOrder` text NOT NULL DEFAULT ('[]'),
	`currentTurnUserId` int,
	`contextSummary` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_sessions_id` PRIMARY KEY(`id`)
);
