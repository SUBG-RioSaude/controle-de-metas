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
  'NEXT_PUBLIC_METAS_AUTH_API',
  'NEXT_PUBLIC_METAS_API',
  'NEXT_PUBLIC_METAS_SUPPORT_API',
  'NEXT_PUBLIC_METAS_SYSTEMS_API',
  'NEXT_PUBLIC_METAS_SYSTEM_ID',
  'NEXT_PUBLIC_METAS_GOOGLE_CLIENT_ID',
  'NEXT_PUBLIC_METAS_DISCORD_CATEGORY_ID',
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
    // A classe "dark" é fixa: o sistema não tem tema claro. Ela fica aqui no
    // HTML servido, e não injetada por JS, para não existir frame claro antes
    // da hidratação.
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
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
