export default function BillingSuccess() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0fdfa' }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
        <h1 style={{ color: '#0891b2', fontSize: 24, marginBottom: 12 }}>Subscription Active!</h1>
        <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.6 }}>
          Thank you! Your Automated Intake subscription is now active. You can close this tab and return to Tekmetric.
        </p>
        <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 24 }}>
          The extension will automatically detect your new subscription within a few minutes. Click "Refresh License" in Settings for instant activation.
        </p>
      </div>
    </div>
  );
}
