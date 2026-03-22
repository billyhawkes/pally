import { createFileRoute, useRouter, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { getSession } from "@/lib/client-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const Route = createFileRoute("/auth/create-organization")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: "/auth/login", search: { redirect: "/" } });
    }
  },
  component: CreateOrganizationPage,
});

function CreateOrganizationPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const name = (data.get("name") as string).trim();

    if (!name) {
      setError("Organization name is required");
      setLoading(false);
      return;
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data: org, error: createError } =
      await authClient.organization.create({
        name,
        slug,
      });

    if (createError) {
      setError(createError.message ?? "Failed to create organization");
      setLoading(false);
      return;
    }

    if (org?.id) {
      await authClient.organization.setActive({
        organizationId: org.id,
      });
    }

    router.navigate({
      to: "/org/$orgSlug/tasks",
      params: { orgSlug: org?.slug ?? slug },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an organization</CardTitle>
          <CardDescription>
            You need an organization to get started with Pally.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="name">Organization name</Label>
              <Input
                id="name"
                name="name"
                placeholder="My Organization"
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create organization"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
