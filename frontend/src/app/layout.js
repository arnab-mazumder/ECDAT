import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata = {
  title: "ECDAT - Enterprise Cryptographic Discovery & Analysis Tool",
  description: "Overview of your cryptographic inventory and quantum readiness.",
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