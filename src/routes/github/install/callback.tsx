import { useAtomSet } from "@effect/atom-react";
import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";
import { useEffect, useMemo, useState } from "react";
import { updateProjectAtom } from "@/lib/atoms/projects";
import { GithubInstallState, ProjectId } from "@/lib/schemas";
import { Button } from "@/components/ui/button";

type InstallationRepository = {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
};

const defaultReturnTo = "/";
const decodeProjectId = Schema.decodeUnknownSync(ProjectId);
const decodeInstallStateFromJson = Schema.decodeUnknownSync(
  Schema.fromJsonString(GithubInstallState),
);

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return window.atob(padded);
};

const decodeInstallState = (value: string): typeof GithubInstallState.Type | null => {
  try {
    return decodeInstallStateFromJson(decodeBase64Url(value));
  } catch {
    return null;
  }
};

export const Route = createFileRoute("/github/install/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    installation_id:
      typeof search.installation_id === "string" ? search.installation_id : "",
    setup_action: typeof search.setup_action === "string" ? search.setup_action : null,
    state: typeof search.state === "string" ? search.state : "",
  }),
  component: GithubInstallCallbackPage,
});

function GithubInstallCallbackPage() {
  const search = Route.useSearch();
  const updateProject = useAtomSet(updateProjectAtom);
  const [repositories, setRepositories] = useState<ReadonlyArray<InstallationRepository>>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [linkingRepo, setLinkingRepo] = useState<string | null>(null);

  const installState = useMemo(() => decodeInstallState(search.state), [search.state]);

  useEffect(() => {
    const loadRepositories = async () => {
      if (!search.installation_id || !installState) {
        setError("The GitHub install callback is missing required information.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/github/installations/${search.installation_id}/repositories`,
        );

        if (!response.ok) {
          throw new Error("Failed to load repositories for this installation");
        }

        const data = (await response.json()) as ReadonlyArray<InstallationRepository>;
        setRepositories(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load repositories for this installation",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadRepositories();
  }, [installState, search.installation_id]);

  const handleLinkRepository = async (repositoryFullName: string) => {
    if (!installState || !search.installation_id) {
      return;
    }

    setError("");
    setLinkingRepo(repositoryFullName);

    try {
      await Promise.resolve(
        updateProject({
          params: { id: decodeProjectId(installState.projectId) },
          payload: {
            githubRepositoryFullName: repositoryFullName,
            githubInstallationId: search.installation_id,
          },
          reactivityKeys: ["projects"],
        }),
      );

      window.location.assign(installState.returnTo || defaultReturnTo);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to link the GitHub repository",
      );
      setLinkingRepo(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          GitHub install flow
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Choose a repository</h1>
        <p className="text-sm text-muted-foreground">
          Select which installed repository should be linked to this Pally project.
        </p>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading repositories...</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error && repositories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No repositories are available for this installation yet.
        </p>
      ) : null}

      <div className="grid gap-3">
        {repositories.map((repository) => (
          <button
            key={repository.id}
            type="button"
            className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-left transition hover:border-primary/40 hover:bg-accent"
            disabled={linkingRepo !== null}
            onClick={() => {
              void handleLinkRepository(repository.fullName);
            }}
          >
            <div className="space-y-1">
              <p className="font-medium text-foreground">{repository.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {repository.private ? "Private repository" : "Public repository"}
              </p>
            </div>
            <span className="text-sm text-muted-foreground">
              {linkingRepo === repository.fullName ? "Linking..." : "Link repo"}
            </span>
          </button>
        ))}
      </div>

      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            window.location.assign(installState?.returnTo || defaultReturnTo);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
