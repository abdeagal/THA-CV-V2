import "./globals.css";

export const metadata = {
  title: "THA CV Formatter Prototype",
  description: "Upload, extract, edit, and generate THA-style client CVs."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
