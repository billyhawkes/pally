ALTER TABLE "projects"
ADD COLUMN "github_repository_full_name" varchar(255),
ADD COLUMN "github_installation_id" varchar(255);

ALTER TABLE "tasks"
ADD COLUMN "github_issue_number" integer,
ADD COLUMN "github_issue_id" varchar(255),
ADD COLUMN "github_issue_url" text;
