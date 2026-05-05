export const metadata = {
  title: 'Automated Intake',
  description: 'AI-powered voice capture for auto repair shops',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
