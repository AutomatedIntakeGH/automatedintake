export const metadata = {
  title: 'Privacy Policy — Automated Intake',
};

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1e293b', lineHeight: 1.7 }}>
      <h1 style={{ color: '#0891b2', fontSize: 28, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>Last updated: May 5, 2026</p>

      <p><strong>Automated Intake</strong> ("the Extension") is operated by Automated Shop Solutions LLC ("we", "us", "our"). This policy explains what data the Extension collects, how it is used, and your rights.</p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>1. What We Collect</h2>
      <p><strong>Microphone audio.</strong> When you click "Start Recording," the Extension captures microphone audio in your browser. Audio is streamed directly to Deepgram (a third-party speech-to-text provider) for real-time transcription. We do not store raw audio on our servers.</p>
      <p><strong>Transcripts and AI-generated notes.</strong> The transcribed text is sent to Anthropic's Claude API for structured extraction (concerns, notes). These results are displayed in the Extension sidebar and, at your direction, pushed to your Tekmetric repair order.</p>
      <p><strong>Google account information.</strong> When you sign in with Google, we receive your name, email address, and profile picture from Google. This is used solely for authentication and license management.</p>
      <p><strong>Tekmetric shop identifier.</strong> The Extension reads the Tekmetric shop ID from the page URL to associate your license with your shop. We do not access any other Tekmetric data beyond what is visible on the repair order page you are viewing.</p>
      <p><strong>Device fingerprint.</strong> A randomly generated identifier stored locally to manage per-device licensing. This is not derived from hardware or browsing data.</p>
      <p><strong>API keys.</strong> Your Deepgram and Anthropic API keys are stored locally in Chrome extension storage on your device. They are sent only to the respective API providers and never to our servers.</p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>2. How We Use Your Data</h2>
      <p>We use collected data to: provide the transcription and note-extraction service; manage your license and subscription; send transactional emails (trial reminders, billing notices); and improve the product.</p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>3. Third-Party Services</h2>
      <p>The Extension integrates with the following third-party services, each governed by their own privacy policies:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Deepgram</strong> — speech-to-text transcription</li>
        <li><strong>Anthropic (Claude)</strong> — AI-powered text analysis</li>
        <li><strong>Google OAuth</strong> — authentication</li>
        <li><strong>Stripe</strong> — payment processing</li>
        <li><strong>Tekmetric</strong> — repair order management (data is pushed only at your explicit action)</li>
      </ul>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>4. Data Storage and Security</h2>
      <p>License and subscription data is stored in a secured Supabase (PostgreSQL) database. All communication between the Extension and our backend uses HTTPS encryption. We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>5. Data Retention</h2>
      <p>Transcripts and extracted notes are stored locally in your browser's extension storage and are associated with individual repair orders. They are not uploaded to our servers. License records are retained for the duration of your subscription plus 90 days after cancellation.</p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>6. Your Rights</h2>
      <p>You may request deletion of your account and associated data at any time by contacting us. You can revoke microphone access through your browser settings. Uninstalling the Extension removes all locally stored data.</p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>7. Children's Privacy</h2>
      <p>The Extension is designed for use by automotive service professionals. We do not knowingly collect data from children under 13.</p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>8. Changes to This Policy</h2>
      <p>We may update this policy from time to time. Material changes will be communicated through the Extension or by email.</p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>9. Contact</h2>
      <p>For questions about this policy or your data, contact us at:</p>
      <p style={{ marginLeft: 16 }}>
        Automated Shop Solutions LLC<br />
        Email: <a href="mailto:support@automatedintake.app" style={{ color: '#0891b2' }}>support@automatedintake.app</a>
      </p>
    </div>
  );
}
