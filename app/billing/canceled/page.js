export default function BillingCanceled() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fef2f2' }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: 40 }}>
        <h1 style={{ color: '#1e293b', fontSize: 24, marginBottom: 12 }}>Checkout Canceled</h1>
        <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.6 }}>
          No worries — you can subscribe anytime from the extension Settings panel.
        </p>
        <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 24 }}>
          You can close this tab and return to Tekmetric.
        </p>
      </div>
    </div>
  );
}
