import { wrapEmailHtml } from './email.js';

/**
 * All email template generators.
 * Each returns { subject, html, text }.
 */

export function trialStartedEmail({ shopName, expiresAt, checkoutUrl }) {
  const expiry = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  });
  return {
    subject: 'Your Automated Intake trial has started',
    html: wrapEmailHtml({
      title: 'Your 30-day free trial is active!',
      body: `
        <p>Thanks for trying Automated Intake at <strong>${shopName}</strong>.</p>
        <p>Your trial is now active and will expire on <strong>${expiry}</strong>.</p>
        <p>During your trial you get full access to:</p>
        <ul style="padding-left:20px;">
          <li>Voice-to-RO automation</li>
          <li>AI-powered concern extraction</li>
          <li>One-click push to Tekmetric</li>
          <li>Smart RO Notes (customer, vehicle, expectations)</li>
        </ul>
        <p>We'll email you 7 days, 3 days, and 1 day before your trial ends. After expiry you have a 36-hour grace period before access is paused.</p>
        <p>Want to lock in the <strong>$99/mo founding rate</strong>? Only available for the first 10 shops.</p>
      `,
      ctaUrl: checkoutUrl,
      ctaText: 'Subscribe Now — $99/mo',
    }),
    text: `Your Automated Intake trial has started!\n\nShop: ${shopName}\nExpires: ${expiry}\n\nSubscribe at: ${checkoutUrl}`,
  };
}

export function trial7DayEmail({ shopName, expiresAt, checkoutUrl }) {
  const expiry = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
  return {
    subject: 'Your Automated Intake trial expires in 7 days',
    html: wrapEmailHtml({
      title: '7 days left on your trial',
      body: `
        <p>Your Automated Intake trial at <strong>${shopName}</strong> expires on <strong>${expiry}</strong>.</p>
        <p>After expiry, you'll have a 36-hour grace period. Then recording access will be paused until you subscribe.</p>
        <p>Subscribe now to keep your workflow running without interruption.</p>
      `,
      ctaUrl: checkoutUrl,
      ctaText: 'Subscribe Now',
    }),
    text: `Your trial at ${shopName} expires in 7 days (${expiry}). Subscribe: ${checkoutUrl}`,
  };
}

export function trial3DayEmail({ shopName, expiresAt, checkoutUrl }) {
  const expiry = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
  return {
    subject: 'Your Automated Intake trial expires in 3 days',
    html: wrapEmailHtml({
      title: '3 days remaining',
      body: `
        <p>Your free trial at <strong>${shopName}</strong> ends on <strong>${expiry}</strong>.</p>
        <p>After that: 36-hour grace period, then access is paused.</p>
        <p>Don't lose your recording workflow — subscribe now.</p>
      `,
      ctaUrl: checkoutUrl,
      ctaText: 'Subscribe Now',
    }),
    text: `3 days left on your trial at ${shopName}. Expires: ${expiry}. Subscribe: ${checkoutUrl}`,
  };
}

export function trial1DayEmail({ shopName, expiresAt, checkoutUrl }) {
  return {
    subject: 'Your Automated Intake trial expires TOMORROW',
    html: wrapEmailHtml({
      title: 'Final day — trial expires tomorrow',
      body: `
        <p>Your trial at <strong>${shopName}</strong> expires in less than 24 hours.</p>
        <p>After expiry you have 36 hours of grace, then recording access stops.</p>
        <p><strong>Subscribe now to avoid any interruption to your advisors' workflow.</strong></p>
      `,
      ctaUrl: checkoutUrl,
      ctaText: 'Subscribe Now — Keep Recording',
    }),
    text: `URGENT: Your trial at ${shopName} expires tomorrow. Subscribe now: ${checkoutUrl}`,
  };
}

export function trialExpiredGraceEmail({ shopName, lockoutAt, checkoutUrl }) {
  const lockout = new Date(lockoutAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  });
  return {
    subject: 'Your trial expired — 36-hour grace period started',
    html: wrapEmailHtml({
      title: 'Trial expired — grace period active',
      body: `
        <p>Your free trial at <strong>${shopName}</strong> has expired.</p>
        <p>Recording still works during the <strong>36-hour grace period</strong>. Access will be paused at <strong>${lockout}</strong> unless you subscribe.</p>
      `,
      ctaUrl: checkoutUrl,
      ctaText: 'Subscribe Now — Avoid Lockout',
    }),
    text: `Your trial at ${shopName} expired. Grace period ends: ${lockout}. Subscribe: ${checkoutUrl}`,
  };
}

export function trialLockedEmail({ shopName, checkoutUrl }) {
  return {
    subject: 'Your Automated Intake access has been paused',
    html: wrapEmailHtml({
      title: 'Access paused — subscription required',
      body: `
        <p>The free trial at <strong>${shopName}</strong> has ended and the grace period has passed.</p>
        <p>Recording access is now paused. Subscribe to resume immediately.</p>
        <p>Your existing data (concerns, notes) is preserved. Nothing is lost — subscribe within 30 days and everything picks up where you left off.</p>
      `,
      ctaUrl: checkoutUrl,
      ctaText: 'Subscribe to Resume',
    }),
    text: `Access paused at ${shopName}. Subscribe to resume: ${checkoutUrl}`,
  };
}

export function paidWelcomeEmail({ shopName, planName, price, nextBillingDate, portalUrl }) {
  const billing = new Date(nextBillingDate).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
  return {
    subject: 'Welcome to Automated Intake — subscription active',
    html: wrapEmailHtml({
      title: 'Subscription confirmed!',
      body: `
        <p>Thank you! <strong>${shopName}</strong> now has full access to Automated Intake.</p>
        <p><strong>Plan:</strong> ${planName} (${price}/mo)<br>
        <strong>Next billing date:</strong> ${billing}</p>
        <p>Manage your subscription (update card, view invoices, cancel) anytime via the Customer Portal.</p>
      `,
      ctaUrl: portalUrl,
      ctaText: 'Manage Subscription',
    }),
    text: `Subscription active! ${shopName} — ${planName} ${price}/mo. Next billing: ${billing}. Manage: ${portalUrl}`,
  };
}

export function subscriptionCanceledEmail({ shopName, accessEndsAt, checkoutUrl }) {
  const ends = new Date(accessEndsAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
  return {
    subject: 'Your subscription has been canceled',
    html: wrapEmailHtml({
      title: 'Subscription canceled',
      body: `
        <p>Your Automated Intake subscription at <strong>${shopName}</strong> has been canceled.</p>
        <p>You still have access until <strong>${ends}</strong> (end of current billing period).</p>
        <p>Changed your mind? You can resubscribe anytime before that date.</p>
      `,
      ctaUrl: checkoutUrl,
      ctaText: 'Resubscribe',
    }),
    text: `Subscription canceled at ${shopName}. Access until: ${ends}. Resubscribe: ${checkoutUrl}`,
  };
}

export function paymentFailedEmail({ shopName, portalUrl }) {
  return {
    subject: 'Payment issue — update your billing info',
    html: wrapEmailHtml({
      title: 'Payment failed',
      body: `
        <p>We couldn't process the latest payment for <strong>${shopName}</strong>.</p>
        <p>Please update your payment method in the Customer Portal to avoid any interruption to service.</p>
      `,
      ctaUrl: portalUrl,
      ctaText: 'Update Payment Method',
    }),
    text: `Payment failed for ${shopName}. Update your card: ${portalUrl}`,
  };
}
