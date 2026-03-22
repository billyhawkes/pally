import { createContext, useContext, useMemo } from "react"
import { authClient } from "@/lib/auth-client"

export interface AuthState {
  session: {
    user: {
      id: string
      name: string
      email: string
      emailVerified: boolean
      createdAt: Date
      updatedAt: Date
      image?: string | null
    }
    session: {
      id: string
      userId: string
      expiresAt: Date
      createdAt: Date
      updatedAt: Date
      token: string
    }
  } | null
  isPending: boolean
  signIn: typeof authClient.signIn
  signUp: typeof authClient.signUp
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>(null!)

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession()

  const auth: AuthState = useMemo(
    () => ({
      session: session ?? null,
      isPending,
      signIn: authClient.signIn,
      signUp: authClient.signUp,
      signOut: async () => {
        await authClient.signOut()
      },
    }),
    [session, isPending],
  )

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
