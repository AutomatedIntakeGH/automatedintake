import type { Plan } from './types'

export const PLAN_LIMITS: Record<Plan, number> = {
  free:       5,
  solo:       Infinity,
  pro:        Infinity,
  shop:       Infinity,
  enterprise: Infinity,
}

export const PLAN_LABELS: Record<Plan, string> = {
  free:       'Free',
  solo:       'Solo — $29/mo',
  pro:        'Pro — $79/mo',
  shop:       'Shop',
  enterprise: 'Enterprise',
}

export function isAtLimit(plan: Plan, monthlyCount: number): boolean {
  return monthlyCount >= PLAN_LIMITS[plan]
}
