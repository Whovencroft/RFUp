CREATE TABLE `commendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`characterId` int NOT NULL,
	`characterName` varchar(128) NOT NULL,
	`awardedByUserId` int NOT NULL,
	`awardedByName` varchar(128) NOT NULL,
	`reason` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commendations_id` PRIMARY KEY(`id`)
);
