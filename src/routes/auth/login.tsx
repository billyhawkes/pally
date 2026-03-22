import { Link, createFileRoute } from "@tanstack/react-router"
import { useEffect, useState, type FormEvent } from "react"
import { Github, LoaderCircle } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { sanitizeRedirect } from "@/lib/auth-redirect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: sanitizeRedirect(search.redirect),
  }),
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [githubAvailable, setGithubAvailable] = useState(false)
  const [githubAvailabilityLoading, setGithubAvailabilityLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadProviders = async () => {
      try {
        const response = await fetch("/api/auth/providers")

        if (!response.ok) {
          throw new Error("Failed to load auth providers")
        }

        const data = (await response.json()) as {
          github?: { configured?: boolean }
        }

        if (!cancelled) {
          setGithubAvailable(Boolean(data.github?.configured))
        }
      } catch {
        if (!cancelled) {
          setGithubAvailable(false)
        }
      } finally {
        if (!cancelled) {
          setGithubAvailabilityLoading(false)
        }
      }
    }

    loadProviders()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = e.target as HTMLFormElement
    const data = new FormData(form)
    const email = data.get("email") as string
    const password = data.get("password") as string

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    })

    setLoading(false)

    if (authError) {
      setError(authError.message ?? "Invalid credentials")
      return
    }

    window.location.assign(search.redirect)
  }

  const handleGithubSignIn = async () => {
    setError("")
    if (!githubAvailable) {
      setError("GitHub sign-in is not configured")
      return
    }

    setGithubLoading(true)

    const result = await authClient.signIn.social({
      provider: "github",
      callbackURL: search.redirect,
      newUserCallbackURL: search.redirect,
    })

    setGithubLoading(false)

    if (result.error) {
      setError(result.error.message ?? "Failed to sign in with GitHub")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to Pally</CardTitle>
          <CardDescription>
            Enter your email and password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {githubAvailabilityLoading || githubAvailable ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading || githubLoading || githubAvailabilityLoading}
                  onClick={handleGithubSignIn}
                >
                  {githubLoading || githubAvailabilityLoading ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Github className="mr-2 size-4" />
                  )}
                  Sign in with GitHub
                </Button>
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Or continue with email
                  </span>
                  <Separator className="flex-1" />
                </div>
              </>
            ) : null}
            <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                to="/auth/signup"
                search={{ redirect: search.redirect }}
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
