ALTER TABLE "projects" ADD COLUMN "team_id" varchar(255);
--> statement-breakpoint
UPDATE "projects" AS "project"
SET "team_id" = "derived"."team_id"
FROM (
	SELECT "project_id", MIN("team_id") AS "team_id"
	FROM "tasks"
	WHERE "project_id" IS NOT NULL
		AND "team_id" IS NOT NULL
	GROUP BY "project_id"
	HAVING COUNT(DISTINCT "team_id") = 1
) AS "derived"
WHERE "project"."id" = "derived"."project_id";
