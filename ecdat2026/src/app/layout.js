import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata = {
  title: "Omnicipher - Enterprise Cryptographic Discovery & Analysis Tool",
  description: "Enterprise Cryptographic Discovery & Analysis Tool",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}