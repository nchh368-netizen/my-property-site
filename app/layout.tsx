import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KH Property Tax & Transfer Fee Estimator',
  description: 'Cambodia Real Estate Tax Calculator — Transfer, Property & Unused Land',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  )
}
