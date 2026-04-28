import type { Trade } from './types'

const TRADE_LABELS: Record<Trade, string> = {
  auto: 'auto repair',
  hvac: 'HVAC',
  plumbing: 'plumbing',
  electrical: 'electrical',
  roofing: 'roofing',
  landscaping: 'landscaping',
  contractor: 'general contracting',
}

const TRADE_ROLES: Record<Trade, string> = {
  auto: 'service advisor',
  hvac: 'HVAC technician',
  plumbing: 'plumber',
  electrical: 'electrician',
  roofing: 'roofing contractor',
  landscaping: 'landscaper',
  contractor: 'general contractor',
}

const TRADE_SCHEMAS: Record<Trade, object> = {
  auto: {
    customer: { name: '', phone: '', email: '' },
    vehicle: { year: '', make: '', model: '', mileage: '', vin: '', plate: '' },
    concerns: [
      {
        description: '',
        priority: 'high|medium|low',
        when_occurs: 'always|cold start|highway speed|braking|etc',
        estimated_labor_hours: null,
      },
    ],
    recommended_diagnostics: [],
    follow_up_questions: [],
    advisor_notes: '',
    sentiment: 'positive|neutral|frustrated',
  },
  hvac: {
    customer: { name: '', phone: '', email: '' },
    property: { address: '', type: 'residential|commercial', zones: 1 },
    equipment: [
      {
        type: 'furnace|ac|heat pump|mini split|water heater',
        brand: '',
        model: '',
        serial: '',
        age_years: null,
        location: '',
      },
    ],
    concerns: [
      { description: '', priority: 'emergency|urgent|standard', system_affected: '' },
    ],
    follow_up_questions: [],
    tech_notes: '',
    sentiment: 'positive|neutral|frustrated',
  },
  plumbing: {
    customer: { name: '', phone: '', email: '' },
    property: { address: '', type: 'residential|commercial' },
    fixtures: [
      { type: 'toilet|sink|tub|water heater|main line|etc', location: '', issue: '' },
    ],
    concerns: [
      { description: '', priority: 'emergency|urgent|standard' },
    ],
    estimated_materials: [],
    permit_likely_required: null,
    follow_up_questions: [],
    sentiment: 'positive|neutral|frustrated',
  },
  electrical: {
    customer: { name: '', phone: '', email: '' },
    property: { address: '', type: 'residential|commercial' },
    panel: { brand: '', amperage: null, age_years: null },
    concerns: [
      { description: '', priority: 'emergency|urgent|standard', location: '' },
    ],
    permit_likely_required: null,
    follow_up_questions: [],
    tech_notes: '',
    sentiment: 'positive|neutral|frustrated',
  },
  roofing: {
    customer: { name: '', phone: '', email: '' },
    property: { address: '', type: 'residential|commercial', roof_type: '', age_years: null },
    concerns: [
      { description: '', priority: 'emergency|urgent|standard', location: '' },
    ],
    insurance_claim: null,
    follow_up_questions: [],
    tech_notes: '',
    sentiment: 'positive|neutral|frustrated',
  },
  landscaping: {
    customer: { name: '', phone: '', email: '' },
    property: { address: '', type: 'residential|commercial', lot_size: '' },
    services_requested: [],
    concerns: [
      { description: '', priority: 'standard|urgent' },
    ],
    recurring: null,
    follow_up_questions: [],
    tech_notes: '',
    sentiment: 'positive|neutral|frustrated',
  },
  contractor: {
    customer: { name: '', phone: '', email: '' },
    property: { address: '', type: 'residential|commercial' },
    project_type: '',
    concerns: [
      { description: '', priority: 'high|medium|low', area: '' },
    ],
    estimated_sqft: null,
    permit_likely_required: null,
    follow_up_questions: [],
    tech_notes: '',
    sentiment: 'positive|neutral|frustrated',
  },
}

export function buildSystemPrompt(trade: Trade): string {
  const label = TRADE_LABELS[trade]
  const role = TRADE_ROLES[trade]
  const schema = JSON.stringify(TRADE_SCHEMAS[trade], null, 2)

  return `You are an expert intake assistant for ${label} businesses.

You will receive a transcript of a conversation between a ${role} and a customer.
Your job: extract the information into the JSON schema below.

Rules:
- Only use information explicitly stated. Do NOT invent details.
- If a field is not mentioned, use null.
- For each concern, also estimate priority and (where applicable) labor hours.
- Generate 1-3 follow-up questions the ${role} should ask before the customer leaves.
- Detect customer sentiment: positive, neutral, or frustrated.
- For each extracted field, include a confidence score (0-1) in a parallel _confidence object.

Schema:
${schema}

Return only valid JSON. No markdown fences, no explanation.`
}
