import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LiveBoard",
  description: "Compétition Détente Sèche & Squat Sauté",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
