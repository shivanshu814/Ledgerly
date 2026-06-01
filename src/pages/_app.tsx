import Navigation from "@/components/Navigation";
import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
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
        toastOptions={{
          style: {
            background: "#17211d",
            color: "#fffbf2",
            borderRadius: "16px",
            fontWeight: 800,
          },
        }}
      />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
