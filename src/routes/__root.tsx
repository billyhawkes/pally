import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { RegistryProvider } from "@effect/atom-react";

import appCss from "@/styles.css?url";

export const Route = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Pally" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  ssr: false,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <RegistryProvider>{children}</RegistryProvider>
        <Scripts />
      </body>
    </html>
  );
}
