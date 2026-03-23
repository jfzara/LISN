// /app/layout.jsx

import "./globals.css";

export const metadata = {
  title: "LISN",
  description: "Logic of Structural Interpretation for Music"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}