export const metadata = {
  title: 'Get a Free Quote | Crystal Pro Powerwashing',
}

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: transparent; }
          input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #2563eb !important;
            box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
