import { createElement } from "react"
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDashed,
  Flag,
  type LucideIcon,
} from "lucide-react"
import type { Task } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import {
  priorityColors,
  priorityLabels,
  priorities,
  statusColors,
  statusLabels,
  statuses,
} from "@/components/tasks/task-view-utils"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const statusIcons = {
  todo: Circle,
  in_progress: CircleDashed,
  done: CheckCircle2,
} satisfies Record<Task["status"], LucideIcon>

const priorityIcons = {
  low: Flag,
  medium: Flag,
  high: Flag,
  urgent: Flag,
} satisfies Record<Task["priority"], LucideIcon>

type TaskBadgeSelectProps<T extends string> = {
  value: T
  options: ReadonlyArray<T>
  labelMap: Record<T, string>
  colorMap: Record<T, string>
  iconMap: Record<T, LucideIcon>
  onValueChange: (value: T) => void
  menuWidthClassName?: string
}

function TaskBadgeSelect<T extends string>({
  value,
  options,
  labelMap,
  colorMap,
  iconMap,
  onValueChange,
  menuWidthClassName = "w-44",
}: TaskBadgeSelectProps<T>) {
  const Icon = iconMap[value]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none"
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <Badge
            variant="outline"
            className={cn(
              "h-7 cursor-pointer gap-1.5 rounded-full border-transparent px-2.5 text-xs font-medium shadow-none transition hover:opacity-90",
              colorMap[value],
            )}
          >
            {createElement(Icon, { className: "size-3.5" })}
            {labelMap[value]}
            <ChevronDown className="size-3.5 opacity-60" />
          </Badge>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className={menuWidthClassName}>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onValueChange(nextValue as T)}
        >
          {options.map((option) => {
            const OptionIcon = iconMap[option]

            return (
              <DropdownMenuRadioItem key={option} value={option}>
                {createElement(OptionIcon, { className: "size-3.5" })}
                {labelMap[option]}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TaskStatusBadgeSelect({
  status,
  onStatusChange,
}: {
  status: Task["status"]
  onStatusChange: (status: Task["status"]) => void
}) {
  return (
    <TaskBadgeSelect
      value={status}
      options={statuses}
      labelMap={statusLabels}
      colorMap={statusColors}
      iconMap={statusIcons}
      onValueChange={onStatusChange}
    />
  )
}

export function TaskPriorityBadgeSelect({
  priority,
  onPriorityChange,
}: {
  priority: Task["priority"]
  onPriorityChange: (priority: Task["priority"]) => void
}) {
  return (
    <TaskBadgeSelect
      value={priority}
      options={priorities}
      labelMap={priorityLabels}
      colorMap={priorityColors}
      iconMap={priorityIcons}
      onValueChange={onPriorityChange}
    />
  )
}
