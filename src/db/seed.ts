import { db } from "./layer"
import { team, teamMember } from "./auth-schema"
import { projects, tasks } from "./schema"

type SeedOrganizationDataInput = {
  organizationId: string
  userId: string
}

export async function seedOrganizationData({
  organizationId,
  userId,
}: SeedOrganizationDataInput) {
  const now = new Date()

  const productTeamId = crypto.randomUUID()
  const engineeringTeamId = crypto.randomUUID()
  const workspaceProjectId = crypto.randomUUID()
  const githubProjectId = crypto.randomUUID()

  await db.transaction(async (tx) => {
    await tx.insert(team).values([
      {
        id: productTeamId,
        name: "Product",
        organizationId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: engineeringTeamId,
        name: "Engineering",
        organizationId,
        createdAt: now,
        updatedAt: now,
      },
    ])

    await tx.insert(teamMember).values([
      {
        id: crypto.randomUUID(),
        teamId: productTeamId,
        userId,
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        teamId: engineeringTeamId,
        userId,
        createdAt: now,
      },
    ])

    await tx.insert(projects).values([
      {
        id: workspaceProjectId,
        name: "Workspace setup",
        description: "Shape your first workflow, owners, and project structure.",
        orgId: organizationId,
        teamId: productTeamId,
      },
      {
        id: githubProjectId,
        name: "GitHub sync rollout",
        description: "Prepare projects and tasks for the upcoming GitHub integration.",
        orgId: organizationId,
        teamId: engineeringTeamId,
      },
    ])

    await tx.insert(tasks).values([
      {
        id: crypto.randomUUID(),
        title: "Review the example workspace",
        description: "Use these starter records to get a feel for org, team, and project scoped work.",
        status: "todo",
        priority: "medium",
        orgId: organizationId,
        projectId: null,
        teamId: null,
      },
      {
        id: crypto.randomUUID(),
        title: "Define the first delivery milestones",
        description: "Capture the initial roadmap for the workspace setup project.",
        status: "in_progress",
        priority: "high",
        orgId: organizationId,
        projectId: workspaceProjectId,
        teamId: productTeamId,
      },
      {
        id: crypto.randomUUID(),
        title: "Connect the team workflow to GitHub",
        description: "Outline how issue sync should map into projects and tasks.",
        status: "todo",
        priority: "high",
        orgId: organizationId,
        projectId: githubProjectId,
        teamId: engineeringTeamId,
      },
      {
        id: crypto.randomUUID(),
        title: "Triage the first org-wide backlog",
        description: "Sort the shared backlog before work is split into team-specific queues.",
        status: "todo",
        priority: "urgent",
        orgId: organizationId,
        projectId: workspaceProjectId,
        teamId: null,
      },
    ])
  })
}
