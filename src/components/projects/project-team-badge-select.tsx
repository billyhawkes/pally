import { ChevronDown, Users } from "lucide-react";
import type { TeamId } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TeamBadgeSelectProps = {
  value: TeamId | null;
  teamOptions: ReadonlyArray<{ id: string; name: string }>;
  teamNamesById?: Readonly<Record<string, string>>;
  onValueChange: (value: TeamId | null) => void;
  onTriggerClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function TeamBadgeSelect({
  value,
  teamOptions,
  teamNamesById = {},
  onValueChange,
  onTriggerClick,
}: TeamBadgeSelectProps) {
  const teamLabel = value
    ? (teamNamesById[value] ?? teamOptions.find((team) => team.id === value)?.name ?? value)
    : "No team";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none"
          onClick={onTriggerClick}
        >
          <Badge
            variant="outline"
            className="h-7 cursor-pointer gap-1.5 rounded-full border-border/60 px-2.5 text-xs font-medium shadow-none transition hover:bg-muted/60"
          >
            <Users className="size-3.5" />
            {teamLabel}
            <ChevronDown className="size-3.5 opacity-60" />
          </Badge>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuRadioGroup
          value={value ?? "__none__"}
          onValueChange={(nextValue) =>
            onValueChange(nextValue === "__none__" ? null : (nextValue as TeamId))
          }
        >
          <DropdownMenuRadioItem value="__none__">No team</DropdownMenuRadioItem>
          {teamOptions.map((team) => (
            <DropdownMenuRadioItem key={team.id} value={team.id}>
              {team.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
