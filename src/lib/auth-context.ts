import type { Session } from "@/lib/auth";

export interface AuthState {
  session: Session | null;
}
