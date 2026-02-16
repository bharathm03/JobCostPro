ALTER TABLE `jobs` ADD `machine_type_id` integer REFERENCES machine_types(id);--> statement-breakpoint
ALTER TABLE `jobs` ADD `machine_custom_data` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `machine_cost` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `machine_waste_percentage` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `machine_waste_amount` real DEFAULT 0 NOT NULL;--> statement-breakpoint

-- Migrate first machine entry from junction table into jobs
UPDATE `jobs` SET
  `machine_type_id` = (
    SELECT `machine_type_id` FROM `job_machine_entries`
    WHERE `job_machine_entries`.`job_id` = `jobs`.`id`
    ORDER BY `job_machine_entries`.`id` ASC LIMIT 1
  ),
  `machine_custom_data` = COALESCE(
    (SELECT `machine_custom_data` FROM `job_machine_entries`
     WHERE `job_machine_entries`.`job_id` = `jobs`.`id`
     ORDER BY `job_machine_entries`.`id` ASC LIMIT 1),
    '{}'
  ),
  `machine_cost` = COALESCE(
    (SELECT `cost` FROM `job_machine_entries`
     WHERE `job_machine_entries`.`job_id` = `jobs`.`id`
     ORDER BY `job_machine_entries`.`id` ASC LIMIT 1),
    0
  ),
  `machine_waste_percentage` = COALESCE(
    (SELECT `waste_percentage` FROM `job_machine_entries`
     WHERE `job_machine_entries`.`job_id` = `jobs`.`id`
     ORDER BY `job_machine_entries`.`id` ASC LIMIT 1),
    0
  ),
  `machine_waste_amount` = COALESCE(
    (SELECT `waste_amount` FROM `job_machine_entries`
     WHERE `job_machine_entries`.`job_id` = `jobs`.`id`
     ORDER BY `job_machine_entries`.`id` ASC LIMIT 1),
    0
  )
WHERE EXISTS (
  SELECT 1 FROM `job_machine_entries`
  WHERE `job_machine_entries`.`job_id` = `jobs`.`id`
);--> statement-breakpoint

DROP TABLE `job_machine_entries`;
