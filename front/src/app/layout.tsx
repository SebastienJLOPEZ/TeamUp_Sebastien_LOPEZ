import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'TeamUp',
  description: 'Application de gestion d\'événements sportifs entre particuliers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (<html lang="fr">
      <body>
        {children}
      </body>
    </html>);
}
