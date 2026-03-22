import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import type { OrganizationId } from "@/lib/schemas";

export function CreateTeamDialog({
  open,
  onOpenChange,
  organizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: OrganizationId | null;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setError("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!organizationId) {
      setError("Choose an organization before creating a team.");
      return;
    }

    if (name.trim().length === 0) {
      setError("Team name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await authClient.organization.createTeam({
        name: name.trim(),
        organizationId,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error && submitError.message.trim().length > 0
          ? submitError.message
          : "Failed to create team. Try again.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Team name"
            autoFocus
            aria-invalid={error ? true : undefined}
          />
          <div className="min-h-5 text-sm text-destructive">{error || null}</div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create team"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
