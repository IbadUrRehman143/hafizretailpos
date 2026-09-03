import type {
  Metadata,
  Viewport,
} from "next";

import "../globals.css";

export const metadata: Metadata = {
  title: "Hafiz Retail POS",
  description:
    "Hafiz Retail POS System",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </head>

      <body className="min-h-screen w-full overflow-x-hidden bg-slate-50">
        {children}
      </body>
    </html>
  );
}