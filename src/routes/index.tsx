import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  GitBranch,
  Github,
  HardDrive,
  LayoutDashboard,
  Server,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTeamTheme, teamColorThemes } from "@/lib/team-color-theme";
const featureCards = [
  {
    icon: Server,
    title: "Self-host first",
    description:
      "Run Pally on your own infrastructure with Postgres, Docker, and a stack you can inspect end to end.",
  },
  {
    icon: Sparkles,
    title: "Free forever",
    description:
      "Pally is built to be usable without licenses, seat gates, or premium walls blocking core planning workflows.",
  },
  {
    icon: GitBranch,
    title: "GitHub sync when you want it",
    description:
      "Bring repositories and issues into the same planning surface without making GitHub the entire product story.",
  },
  {
    icon: LayoutDashboard,
    title: "Views for actual work",
    description:
      "Move between board and table layouts, save filters, and give every team a sharper operational default.",
  },
  {
    icon: Users,
    title: "Built for orgs and teams",
    description:
      "Keep company-wide planning, team delivery, and project ownership connected without flattening everything together.",
  },
  {
    icon: HardDrive,
    title: "Own your data",
    description:
      "Because the app is open and self-hosted, your workflow, schema, and deployment choices stay under your control.",
  },
];

const workflowSteps = [
  {
    title: "Deploy it where you want",
    body: "Start locally with Bun, Docker, and Postgres, then run it on the infrastructure your team already trusts.",
  },
  {
    title: "Shape your workspace",
    body: "Create organizations, teams, projects, and saved views that reflect how your group actually plans and ships.",
  },
  {
    title: "Layer in GitHub sync",
    body: "Connect repos and issues when you need them, while keeping Pally useful even without every integration enabled.",
  },
];

const proofPoints = [
  "100% open source",
  "Free forever",
  "Self-hosted by default",
  "GitHub sync included",
];

const faqItems = [
  {
    question: "Is Pally really free forever?",
    answer:
      "Yes. The product is positioned as free forever, with the full codebase available for teams that want to run it themselves.",
  },
  {
    question: "Do I have to use GitHub integrations to use Pally?",
    answer:
      "No. GitHub sign-in and sync are optional. You can run Pally locally or self-host it without enabling those integrations.",
  },
  {
    question: "Can I self-host it on my own infrastructure?",
    answer:
      "Yes. Pally is designed with self-hosting in mind and already uses familiar building blocks like Docker, Postgres, Bun, and TypeScript.",
  },
  {
    question: "Who is Pally for?",
    answer:
      "Teams that want a cleaner planning layer for projects and tasks without giving up control of deployment, data, or engineering workflow.",
  },
];

const heroThemes = [teamColorThemes[0], teamColorThemes[2], teamColorThemes[3]];

const spotlightTheme = teamColorThemes[0] ?? getTeamTheme("workspace");

export const Route = createFileRoute("/")({
  // DO NOT ADD A beforeLoad redirect here.
  loader: async () => {
    try {
      const response = await fetch(
        "https://api.github.com/repos/billyhawkes/pally",
        {
          headers: {
            Accept: "application/vnd.github+json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load repo metadata");
      }

      const data = (await response.json()) as { stargazers_count?: number };

      return {
        githubStars: data.stargazers_count ?? null,
      };
    } catch {
      return {
        githubStars: null,
      };
    }
  },
  head: () => ({
    meta: [
      { title: "Pally | Open-source project planning for self-hosted teams" },
      {
        name: "description",
        content:
          "Pally is a free forever, open-source project and task app built for self-hosting, with optional GitHub sync and team-based planning.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { githubStars } = Route.useLoaderData();

  return (
    <main className="relative overflow-x-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-muted/30 to-background" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top,_hsl(var(--muted))_0%,_transparent_70%)]" />

      <div className="fixed inset-x-0 top-4 z-30 px-6 sm:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-border/60 bg-background/75 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <FolderKanban className="size-5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-heading text-sm font-semibold tracking-[0.16em] uppercase">
                  Pally
                </span>
                <span className="text-xs text-muted-foreground">
                  Open-source planning for self-hosted teams
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" asChild>
                <a
                  href="https://github.com/billyhawkes/pally"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github data-icon="inline-start" />
                  GitHub
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    <Star className="size-3" />
                    {formatCompactNumber(githubStars)}
                  </span>
                </a>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/auth/login" search={{ redirect: "/" }}>
                  Sign in
                </Link>
              </Button>
              <Button asChild>
                <Link to="/auth/signup" search={{ redirect: "/" }}>
                  Create account
                </Link>
              </Button>
            </div>
          </header>
        </div>
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-28 pb-6 sm:px-8 sm:pt-32 lg:px-10">
        <section className="grid flex-1 gap-12 py-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center lg:py-20">
          <div className="flex max-w-2xl flex-col gap-8">
            <div className="flex flex-col gap-6">
              <Badge
                variant="secondary"
                className={`w-fit ${spotlightTheme.soft}`}
              >
                <Server data-icon="inline-start" />
                Open source, free forever, self-host first
              </Badge>
              <div className="flex flex-col gap-5">
                <h1 className="font-heading text-4xl leading-[0.95] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                  The open-source planning app for teams that self-host.
                </h1>
                <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Run projects, tasks, and saved views on your own
                  infrastructure. Pally stays free forever, works without vendor
                  lock-in, and adds GitHub sync when you want it.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/auth/signup" search={{ redirect: "/" }}>
                  Start free
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth/login" search={{ redirect: "/" }}>
                  Sign in
                </Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {proofPoints.map((point, index) => {
                const theme =
                  heroThemes[index % heroThemes.length] ?? spotlightTheme;

                return (
                  <div
                    key={point}
                    className="flex items-center gap-2 rounded-2xl border bg-background/80 px-4 py-3 text-sm text-muted-foreground shadow-sm backdrop-blur"
                  >
                    <CheckCircle2
                      className={`size-4 shrink-0 ${theme.soft.split(" ")[1]}`}
                    />
                    <span>{point}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-background/90 p-3 shadow-2xl shadow-foreground/5 ring-1 ring-foreground/10 backdrop-blur">
              <img
                src="/banner.png"
                alt="Pally workspace preview"
                className="h-[18rem] w-full rounded-[1.5rem] object-cover object-left-top sm:h-[24rem] lg:h-[32rem]"
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-10 pb-16 lg:pb-24">
          <div className="flex max-w-3xl flex-col gap-4">
            <Badge variant="outline" className="w-fit">
              Why Pally
            </Badge>
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for teams that want control, clarity, and a planning tool
              they can actually keep.
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              The value is not just that it syncs with GitHub. It is that the
              app is open, self-hostable, and useful on its own.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, description }, index) => {
              const theme =
                heroThemes[index % heroThemes.length] ?? spotlightTheme;

              return (
                <Card key={title} className="h-full bg-background/85 shadow-sm">
                  <CardHeader className="flex flex-col gap-4">
                    <div
                      className={`flex size-12 items-center justify-center rounded-2xl ${theme.icon}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <CardTitle>{title}</CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-8 pb-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:pb-24">
          <Card className="bg-foreground text-background shadow-xl shadow-foreground/10 ring-0">
            <CardHeader className="flex flex-col gap-3">
              <Badge className="w-fit bg-background text-foreground">
                How it fits
              </Badge>
              <CardTitle className="text-3xl text-balance sm:text-4xl">
                A planning home your team can run, trust, and grow into.
              </CardTitle>
              <CardDescription className="text-background/70">
                Start with the core app, keep it free, and add integrations only
                where they make your workflow better.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col items-start gap-3 border-t border-background/10 bg-background/5 text-background/80">
              <p className="text-sm">
                Best for internal platforms, product-minded engineering teams,
                and anyone who prefers self-hosted tools over SaaS sprawl.
              </p>
              <Button variant="secondary" asChild>
                <Link to="/auth/signup" search={{ redirect: "/" }}>
                  Create your workspace
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <div className="grid gap-4">
            {workflowSteps.map((step, index) => {
              const theme =
                heroThemes[index % heroThemes.length] ?? spotlightTheme;

              return (
                <Card key={step.title} className="bg-background/85 shadow-sm">
                  <CardHeader className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
                    <div
                      className={`flex size-12 items-center justify-center rounded-2xl font-heading text-lg font-semibold ${theme.icon}`}
                    >
                      0{index + 1}
                    </div>
                    <div className="flex flex-col gap-2">
                      <CardTitle>{step.title}</CardTitle>
                      <CardDescription>{step.body}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-8 pb-20">
          <div className="flex max-w-2xl flex-col gap-4">
            <Badge variant="outline" className="w-fit">
              FAQ
            </Badge>
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              The practical questions teams ask first.
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              The short version: yes, it is open, self-hostable, and free.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {faqItems.map((item) => {
              return (
                <Card
                  key={item.question}
                  className="h-full bg-background/85 shadow-sm"
                >
                  <CardHeader className="flex flex-col gap-2">
                    <CardTitle className="text-xl">{item.question}</CardTitle>
                    <CardDescription>{item.answer}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <footer className="border-t py-8">
          <div className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">Pally</p>
              <p>Open-source project planning for self-hosted teams.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="https://github.com/billyhawkes/pally"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                GitHub
              </a>
              <Link
                to="/auth/login"
                search={{ redirect: "/" }}
                className="transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                to="/auth/signup"
                search={{ redirect: "/" }}
                className="transition-colors hover:text-foreground"
              >
                Create account
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function formatCompactNumber(value: number | null) {
  if (value === null) {
    return "Open repo";
  }

  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}
