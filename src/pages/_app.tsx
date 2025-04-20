import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import Navigation from "@/components/Navigation";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <Head>
        <title>Expense Tracker</title>
        <meta name="description" content="Track your expenses easily" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4F46E5" />
      </Head>
      <Navigation />
      <Toaster position="top-right" />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
