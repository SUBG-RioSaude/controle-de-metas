import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Controle de Metas — SMS Rio",
  description:
    "Acompanhamento detalhado do Plano de Ação TCMRio da Secretaria Municipal de Saúde do Rio de Janeiro.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ENV__ = ${JSON.stringify({
              NEXT_PUBLIC_AUTH_API: process.env.NEXT_PUBLIC_AUTH_API,
              NEXT_PUBLIC_METAS_API: process.env.NEXT_PUBLIC_METAS_API,
              NEXT_PUBLIC_SUPPORT_API: process.env.NEXT_PUBLIC_SUPPORT_API,
              NEXT_PUBLIC_SYSTEMS_API: process.env.NEXT_PUBLIC_SYSTEMS_API,
              NEXT_PUBLIC_SYSTEM_ID: process.env.NEXT_PUBLIC_SYSTEM_ID,
              NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
              NEXT_PUBLIC_DISCORD_CATEGORY_ID: process.env.NEXT_PUBLIC_DISCORD_CATEGORY_ID,
            })}`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
