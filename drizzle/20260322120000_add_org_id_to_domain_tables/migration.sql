ALTER TABLE "tasks" ADD COLUMN "org_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "org_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "views" ADD COLUMN "org_id" varchar(255);
