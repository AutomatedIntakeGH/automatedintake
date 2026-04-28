'use client'

import React from 'react'
import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer'
import type { ExportState } from './format-work-order'

const CYAN = '#06B6D4'
const DARK = '#0F172A'
const MID  = '#475569'

const s = StyleSheet.create({
  page:      { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  brand:     { fontSize: 16, fontFamily: 'Helvetica-Bold', color: DARK },
  brandSpan: { color: CYAN },
  headerMeta:{ fontSize: 9, color: MID, textAlign: 'right' },
  divider:   { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginVertical: 12 },
  section:   { marginBottom: 14 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: CYAN, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  row:       { flexDirection: 'row', marginBottom: 3 },
  label:     { fontSize: 9, color: MID, width: 70 },
  value:     { fontSize: 9, color: DARK, flex: 1 },
  concern:   { marginBottom: 8, paddingLeft: 6, borderLeftWidth: 2, borderLeftColor: '#E2E8F0' },
  concernTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 2 },
  concernMeta:  { fontSize: 8, color: MID },
  pill:      { fontSize: 7, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, marginBottom: 3, alignSelf: 'flex-start' },
  pillHigh:  { backgroundColor: '#FEE2E2', color: '#DC2626' },
  pillMed:   { backgroundColor: '#FEF9C3', color: '#CA8A04' },
  pillLow:   { backgroundColor: '#F1F5F9', color: '#64748B' },
  note:      { fontSize: 9, color: DARK, lineHeight: 1.5 },
  fup:       { fontSize: 9, color: DARK, marginBottom: 3 },
  footer:    { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText:{ fontSize: 7, color: '#94A3B8' },
})

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  )
}

function pillStyle(priority: string) {
  const p = priority.toLowerCase()
  if (p === 'high' || p === 'emergency') return { ...s.pill, ...s.pillHigh }
  if (p === 'medium' || p === 'urgent')  return { ...s.pill, ...s.pillMed }
  return { ...s.pill, ...s.pillLow }
}

export async function getPDFBlob(state: ExportState): Promise<Blob> {
  // pdf() expects ReactElement<DocumentProps> — WorkOrderPDF returns Document at root
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pdf(React.createElement(WorkOrderPDF, { state }) as any).toBlob()
}

export function WorkOrderPDF({ state }: { state: ExportState }) {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <Document title="Work Order" author="AutomatedIntake">
      <Page size="LETTER" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>
              Automated<Text style={s.brandSpan}>Intake</Text>
            </Text>
            <Text style={{ fontSize: 8, color: MID, marginTop: 2 }}>
              {state.trade.toUpperCase()} — WORK ORDER
            </Text>
          </View>
          <View>
            <Text style={s.headerMeta}>{dateStr}</Text>
            <Text style={{ ...s.headerMeta, marginTop: 1 }}>
              Sentiment: {state.sentiment}
            </Text>
          </View>
        </View>
        <View style={s.divider} />

        {/* Customer */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Customer</Text>
          <Field label="Name"  value={state.customer.name} />
          <Field label="Phone" value={state.customer.phone} />
          <Field label="Email" value={state.customer.email} />
        </View>

        {/* Vehicle / Property */}
        {state.trade === 'auto' ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Vehicle</Text>
            <Field label="Year / Make" value={[state.vehicle.year, state.vehicle.make, state.vehicle.model].filter(Boolean).join(' ')} />
            <Field label="Mileage"    value={state.vehicle.mileage} />
            <Field label="Plate"      value={state.vehicle.plate} />
            <Field label="VIN"        value={state.vehicle.vin} />
          </View>
        ) : (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Property</Text>
            <Field label="Address" value={state.property.address} />
            <Field label="Type"    value={state.property.type} />
          </View>
        )}

        {/* Concerns */}
        {state.concerns.filter(c => c.description.trim()).length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Concerns</Text>
            {state.concerns.filter(c => c.description.trim()).map((c, i) => (
              <View key={i} style={s.concern}>
                <Text style={{ ...s.pill, ...pillStyle(c.priority) }}>
                  {c.priority.toUpperCase()}
                </Text>
                <Text style={s.concernTitle}>{c.description}</Text>
                {!!c.when_occurs && (
                  <Text style={s.concernMeta}>When: {c.when_occurs}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Follow-up questions */}
        {state.followUps.filter(Boolean).length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Follow-up Questions</Text>
            {state.followUps.filter(Boolean).map((q, i) => (
              <Text key={i} style={s.fup}>{i + 1}. {q}</Text>
            ))}
          </View>
        )}

        {/* Notes */}
        {state.notes.trim() && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              {state.trade === 'auto' ? 'Advisor Notes' : 'Tech Notes'}
            </Text>
            <Text style={s.note}>{state.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>automatedintake.app</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          } />
        </View>

      </Page>
    </Document>
  )
}
