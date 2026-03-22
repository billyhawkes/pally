export const teamColorThemes = [
  {
    group:
      "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-700 active:bg-emerald-500/10 active:text-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300",
    icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    sub: "border-emerald-500/25",
    accent: "from-emerald-500/20 via-emerald-500/8 to-transparent",
    glow: "bg-emerald-500/18",
    border: "border-emerald-500/25",
    soft: "bg-emerald-500/10 text-emerald-700",
  },
  {
    group:
      "bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20 hover:bg-sky-500/10 hover:text-sky-700 active:bg-sky-500/10 active:text-sky-700 dark:text-sky-300 dark:hover:bg-sky-500/10 dark:hover:text-sky-300",
    icon: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    sub: "border-sky-500/25",
    accent: "from-sky-500/20 via-sky-500/8 to-transparent",
    glow: "bg-sky-500/18",
    border: "border-sky-500/25",
    soft: "bg-sky-500/10 text-sky-700",
  },
  {
    group:
      "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 hover:bg-amber-500/10 hover:text-amber-700 active:bg-amber-500/10 active:text-amber-700 dark:text-amber-300 dark:hover:bg-amber-500/10 dark:hover:text-amber-300",
    icon: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    sub: "border-amber-500/25",
    accent: "from-amber-500/20 via-amber-500/8 to-transparent",
    glow: "bg-amber-500/18",
    border: "border-amber-500/25",
    soft: "bg-amber-500/10 text-amber-700",
  },
  {
    group:
      "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20 hover:bg-rose-500/10 hover:text-rose-700 active:bg-rose-500/10 active:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-300",
    icon: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    sub: "border-rose-500/25",
    accent: "from-rose-500/20 via-rose-500/8 to-transparent",
    glow: "bg-rose-500/18",
    border: "border-rose-500/25",
    soft: "bg-rose-500/10 text-rose-700",
  },
  {
    group:
      "bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/20 hover:bg-violet-500/10 hover:text-violet-700 active:bg-violet-500/10 active:text-violet-700 dark:text-violet-300 dark:hover:bg-violet-500/10 dark:hover:text-violet-300",
    icon: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    sub: "border-violet-500/25",
    accent: "from-violet-500/20 via-violet-500/8 to-transparent",
    glow: "bg-violet-500/18",
    border: "border-violet-500/25",
    soft: "bg-violet-500/10 text-violet-700",
  },
] as const;

export const getTeamTheme = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return teamColorThemes[hash % teamColorThemes.length] ?? teamColorThemes[0];
};
