import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Expense Pilot — AI-powered personal finance with spending analysis, anomaly detection, and predictive budgeting." />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
