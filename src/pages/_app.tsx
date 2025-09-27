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
        <title>Expense Tracker shivanshu</title>
        <meta name="description" content="Track your expenses easily" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="google-adsense-account" content="ca-pub-9905115179215642" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9905115179215642"
          crossOrigin="anonymous"
        ></script>
      </Head>
      <Navigation />
      <Toaster position="top-right" />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
