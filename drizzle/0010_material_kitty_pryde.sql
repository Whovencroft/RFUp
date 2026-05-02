CREATE TABLE `supervisorNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`sessionTitle` varchar(256) NOT NULL,
	`supervisorUserId` int NOT NULL,
	`type` enum('player_acted','turn_waiting','player_inactive','turn_skipped','player_kicked') NOT NULL,
	`playerName` varchar(128) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supervisorNotifications_id` PRIMARY KEY(`id`)
);
