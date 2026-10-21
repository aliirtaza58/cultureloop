import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CultureLoop — a next chapter for your books",
  description: "Share books with friends. Find a next read, choose what you would like, and agree on a local exchange together.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" data-scroll-behavior="smooth"><body>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header wrap">
      <a className="wordmark" href="/" aria-label="CultureLoop home"><svg width="29" height="29" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 7C10 3 5 5 3 6v19c4-2 8-2 13 1 5-3 9-3 13-1V6c-4-2-8-2-13 1Zm0 0v19" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>CultureLoop<span className="wordmark-dot">.</span></a>
      <a className="quiet-link" href="/#start">Start a room <span aria-hidden="true">↗</span></a>
    </header>
    {process.env.CULTURELOOP_LOCAL_PROTOTYPE === "true" && <div className="storage-note">Local prototype · rooms are saved on this computer</div>}
    {children}
    <footer className="site-footer wrap"><span>Good books, passed along.</span><span>CultureLoop prototype · <a href="https://github.com/aliirtaza58/cultureloop">Source code</a></span></footer>
  </body></html>;
}
