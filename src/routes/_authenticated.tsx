import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router"
import { getSession } from "@/lib/get-session"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
    return { auth: session }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { auth } = Route.useRouteContext()

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
          <a href="/" className="text-lg font-semibold">
            Pally
          </a>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4 text-sm">
              <a
                href="/tasks"
                className="text-muted-foreground hover:text-foreground"
              >
                Tasks
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {auth.user.name ?? auth.user.email}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

function SignOutButton() {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        const { authClient } = await import("@/lib/auth-client")
        await authClient.signOut()
        router.navigate({ to: "/login", search: { redirect: "/" } })
      }}
    >
      Sign out
    </Button>
  )
}
