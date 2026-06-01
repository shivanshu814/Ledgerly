import Navigation from "@/components/Navigation";
import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <ThemeProvider>
        <Head>
          <title>Ledgerly</title>
          <meta name="description" content="Track expenses, review spending, and export clean reports with Ledgerly." />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#f6f2e9" />
          <meta name="google-adsense-account" content="ca-pub-9905115179215642" />
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9905115179215642"
            crossOrigin="anonymous"
          ></script>
        </Head>
        <Navigation />
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 3500,
            style: {
              background: "var(--bg-card-solid)",
              color: "var(--ink)",
              borderRadius: "14px",
              fontWeight: 700,
              fontSize: "14px",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              padding: "12px 16px",
              maxWidth: "360px",
            },
            success: {
              iconTheme: { primary: "var(--teal)", secondary: "var(--bg-card-solid)" },
              duration: 3000,
            },
            error: {
              iconTheme: { primary: "var(--rose)", secondary: "var(--bg-card-solid)" },
              duration: 4500,
            },
            loading: {
              iconTheme: { primary: "var(--teal)", secondary: "var(--border)" },
            },
          }}
        />
        <Component {...pageProps} />
      </ThemeProvider>
    </ClerkProvider>
  );
}
