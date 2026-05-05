export default function Home() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: 40 }}>
        <h1 style={{ color: '#0891b2', fontSize: 28, marginBottom: 12 }}>Automated Intake</h1>
        <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.6 }}>
          AI-powered voice capture for auto repair shops. This is the backend API server.
        </p>
        <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 24 }}>
          Install the Chrome extension to get started.
        </p>
      </div>
    </div>
  );
}
