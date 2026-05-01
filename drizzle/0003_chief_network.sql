CREATE TABLE `session_join_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(128) NOT NULL,
	`characterName` varchar(128),
	`status` enum('pending','approved','denied') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `session_join_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shift_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`cronExpression` varchar(64) NOT NULL,
	`incidentPoolIds` text NOT NULL DEFAULT ('[]'),
	`defaultPlayerIds` text NOT NULL DEFAULT ('[]'),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shift_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_messages` MODIFY COLUMN `authorType` enum('ai','player','gm') NOT NULL;--> statement-breakpoint
ALTER TABLE `ai_sessions` ADD `gmNotes` text;--> statement-breakpoint
ALTER TABLE `ai_sessions` ADD `inviteToken` varchar(64);--> statement-breakpoint
ALTER TABLE `ai_sessions` ADD `debriefContent` text;--> statement-breakpoint
ALTER TABLE `characters` ADD `callsign` varchar(64);--> statement-breakpoint
ALTER TABLE `characters` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `characters` ADD `avatarPrompt` text;--> statement-breakpoint
ALTER TABLE `skills` ADD `parentSkillId` int;