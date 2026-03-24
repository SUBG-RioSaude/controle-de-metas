import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Controle de Metas — SMS Rio",
  description:
    "Acompanhamento detalhado do Plano de Ação TCMRio da Secretaria Municipal de Saúde do Rio de Janeiro.",
};

export const dynamic = "force-dynamic";

// Indirect access prevents Next.js/SWC from inlining NEXT_PUBLIC_ vars at build time.
// This ensures the values are read from the actual runtime environment (Portainer).
function runtimeEnv(key: string): string | undefined {
  return process.env[key];
}

const ENV_KEYS = [
  'NEXT_PUBLIC_AUTH_API',
  'NEXT_PUBLIC_METAS_API',
  'NEXT_PUBLIC_SUPPORT_API',
  'NEXT_PUBLIC_SYSTEMS_API',
  'NEXT_PUBLIC_SYSTEM_ID',
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
  'NEXT_PUBLIC_DISCORD_CATEGORY_ID',
] as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const envPayload = Object.fromEntries(
    ENV_KEYS.map((k) => [k, runtimeEnv(k) ?? ""])
  );

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ENV__ = ${JSON.stringify(envPayload)}`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
