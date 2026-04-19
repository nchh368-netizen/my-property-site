'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, MapPin, Building2, Leaf, Calculator, FileDown, Check } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Row         { id: string; size: string; price: string }
interface PdfDataRow  { name: string; size: string; price: string }
interface PdfCalcItem { label: string; value: string; indent?: boolean; muted?: boolean }

// ─── Utilities ────────────────────────────────────────────────────────────────
const n = (s: string) => parseFloat(s) || 0
const fmt = (v: number, d = 2) =>
  '$' + v.toLocaleString('en', { minimumFractionDigits: d, maximumFractionDigits: d })

let _id = 0
const mkRow = (size = '', price = ''): Row => ({
  id: `row_${++_id}_${Math.floor(Math.random() * 9999)}`,
  size,
  price,
})
const rowSum = (rows: Row[]) => rows.reduce((s, r) => s + n(r.size) * n(r.price), 0)

// ─── PDF Template Sub-components (plain text only — no SVG, no icons) ─────────

// A single section card inside the PDF
function PdfSection({ title, subtitle, accent, children }: {
  title: string; subtitle: string; accent: string; children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#141210',
      border: '1px solid rgba(201,168,76,0.14)',
      borderRadius: 8,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Section header strip */}
      <div style={{
        background: '#1c1810',
        borderLeft: `4px solid ${accent}`,
        padding: '8px 16px 7px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e8d48b', letterSpacing: '0.06em' }}>
          {title}
        </div>
        <div style={{ fontSize: 10, color: '#7a6a4a', marginTop: 2 }}>{subtitle}</div>
      </div>
      {children}
    </div>
  )
}

// Compact data table for land/floor rows
function PdfTable({ rows }: { rows: PdfDataRow[] }) {
  if (rows.length === 0) return null
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <tbody>
        {rows.map((row, i) => {
          const sub = n(row.size) * n(row.price)
          return (
            <tr key={i} style={{ background: i % 2 === 1 ? 'rgba(201,168,76,0.03)' : 'transparent' }}>
              <td style={{ padding: '4px 16px', fontSize: 11, color: '#c8b890', width: '18%', fontWeight: 600 }}>
                {row.name}
              </td>
              <td style={{ padding: '4px 8px', fontSize: 11, color: '#7a6a4a' }}>
                {n(row.size) > 0 && n(row.price) > 0
                  ? `${n(row.size).toLocaleString('en')} sqm  ×  $${n(row.price).toLocaleString('en')} /sqm`
                  : '—'}
              </td>
              <td style={{ padding: '4px 16px', fontSize: 11, fontWeight: 700, color: '#c9a84c', textAlign: 'right', width: '22%' }}>
                {fmt(sub, 0)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// Calculation breakdown + section total
function PdfCalcBlock({ items, total }: { items: PdfCalcItem[]; total: { label: string; value: string } }) {
  return (
    <div style={{ borderTop: '1px solid rgba(201,168,76,0.1)', padding: '8px 16px 10px' }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '2.5px 0',
          paddingLeft: item.indent ? 18 : 0,
          fontSize: item.indent ? 10.5 : 11,
          color: item.muted ? '#503e28' : item.indent ? '#6a5a3c' : '#9a8a68',
        }}>
          <span>{item.indent ? '↳  ' : ''}{item.label}</span>
          <span style={{ fontWeight: item.indent ? 400 : 600 }}>{item.value}</span>
        </div>
      ))}
      {/* Section total */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: '1px solid rgba(201,168,76,0.18)',
        marginTop: 7,
        paddingTop: 7,
        fontSize: 12.5,
        fontWeight: 700,
        color: '#c9a84c',
      }}>
        <span>{total.label}</span>
        <span>{total.value}</span>
      </div>
    </div>
  )
}

// ─── Main App Interaction Sub-components ──────────────────────────────────────

interface RowListProps {
  rows: Row[]
  singular: string
  sectionLabel: string
  baseIndex: number
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, field: 'size' | 'price', value: string) => void
  addLabel: string
}

function RowList({ rows, singular, sectionLabel, baseIndex, onAdd, onRemove, onUpdate, addLabel }: RowListProps) {
  return (
    <div className="row-section">
      <div className="row-section-title">{sectionLabel}</div>
      <AnimatePresence initial={false}>
        {rows.map((row, i) => {
          const sub = n(row.size) * n(row.price)
          return (
            <motion.div
              key={row.id}
              className="data-row"
              initial={{ opacity: 0, y: -10, scaleY: 0.9 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.9, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ originY: 0 }}
            >
              <div className="data-row-top">
                <span className="row-label">{singular} {i + baseIndex}</span>
                <div className="row-right">
                  <span className="row-subtotal">{fmt(sub, 0)}</span>
                  <button className="delete-btn" onClick={() => onRemove(row.id)} aria-label={`Remove ${singular} ${i + baseIndex}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="data-row-inputs">
                <div className="row-field">
                  <input className="row-input" type="number" inputMode="decimal"
                    value={row.size} onChange={e => onUpdate(row.id, 'size', e.target.value)} placeholder="0" />
                  <span className="row-unit">sqm</span>
                </div>
                <span className="row-op">×</span>
                <div className="row-field">
                  <span className="row-prefix">$</span>
                  <input className="row-input" type="number" inputMode="decimal"
                    value={row.price} onChange={e => onUpdate(row.id, 'price', e.target.value)} placeholder="0" />
                  <span className="row-unit">/sqm</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
      <button className="add-row-btn" onClick={onAdd}><Plus size={14} />{addLabel}</button>
    </div>
  )
}

function CalcLine({ label, value, highlight = false, indent = false }: {
  label: string; value: string; highlight?: boolean; indent?: boolean
}) {
  return (
    <div className={`calc-line${highlight ? ' calc-line-total' : ''}${indent ? ' calc-line-indent' : ''}`}>
      <span>{label}</span>
      <span className={highlight ? 'gold-val' : ''}>{value}</span>
    </div>
  )
}

function ExemptionLine({ enabled, amount, onToggle, onAmountChange }: {
  enabled: boolean; amount: string; onToggle: () => void; onAmountChange: (v: string) => void
}) {
  return (
    <div className="calc-line exempt-line">
      <span>Less Exemption</span>
      <div className="exempt-right">
        <button type="button"
          className={`exempt-checkbox${enabled ? ' exempt-checkbox-on' : ''}`}
          onClick={onToggle} aria-pressed={enabled} aria-label="Toggle exemption">
          {enabled && <Check size={10} strokeWidth={3} />}
        </button>
        <div className={`exempt-field${!enabled ? ' exempt-field-off' : ''}`}>
          <span className="exempt-dollar">$</span>
          <input type="number" className="exempt-input" value={amount}
            onChange={e => onAmountChange(e.target.value)}
            disabled={!enabled} inputMode="decimal" placeholder="0" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TaxCalculator() {
  const [includeUnused, setIncludeUnused] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)

  // Transfer
  const [tLands, setTLands] = useState<Row[]>([mkRow('300', '450'), mkRow('700', '150')])
  const [tFloors, setTFloors] = useState<Row[]>([mkRow('72', '250'), mkRow('72', '200'), mkRow('72', '150')])
  const [tExemptOn, setTExemptOn] = useState(true)
  const [tExemptAmt, setTExemptAmt] = useState('150000')

  // Property
  const [pLands, setPLands] = useState<Row[]>([mkRow('172', '300')])
  const [pFloors, setPFloors] = useState<Row[]>([mkRow('72', '250'), mkRow('72', '200'), mkRow('72', '150')])
  const [pMonths, setPMonths] = useState('0')
  const [pExemptOn, setPExemptOn] = useState(true)
  const [pExemptAmt, setPExemptAmt] = useState('25000')

  // Unused
  const [uLands, setULands] = useState<Row[]>([mkRow('10000', '10')])
  const [uMonths, setUMonths] = useState('0')

  // ── Row helpers ──────────────────────────────────────────────────────────
  const addRow    = (set: React.Dispatch<React.SetStateAction<Row[]>>) => set(p => [...p, mkRow()])
  const removeRow = (set: React.Dispatch<React.SetStateAction<Row[]>>, id: string) =>
    set(p => p.filter(r => r.id !== id))
  const updateRow = (set: React.Dispatch<React.SetStateAction<Row[]>>, id: string, field: 'size' | 'price', v: string) =>
    set(p => p.map(r => r.id === id ? { ...r, [field]: v } : r))

  // ── Calculations ─────────────────────────────────────────────────────────
  const tSub       = rowSum(tLands) + rowSum(tFloors)
  const tExemption = tExemptOn ? n(tExemptAmt) : 0
  const tAfterEx   = Math.max(0, tSub - tExemption)
  const tTax       = tAfterEx * 0.04
  const tTotal     = tTax + 100

  const pSub        = rowSum(pLands) + rowSum(pFloors)
  const p80         = pSub * 0.8
  const pExemption  = pExemptOn ? n(pExemptAmt) : 0
  const pBase       = Math.max(0, p80 - pExemption)
  const pAnnual     = pBase * 0.001
  const pMonthsN    = n(pMonths)
  const pAdditional = pMonthsN > 0 ? pAnnual * 0.1 : 0
  const pInterest   = pMonthsN > 0 ? pAnnual * 0.015 * pMonthsN : 0
  const pTotal      = pAnnual + pAdditional + pInterest

  const uSub        = rowSum(uLands)
  const uBase       = uSub * 0.02
  const uMonthsN    = n(uMonths)
  const uAdditional = uMonthsN > 0 ? uBase * 0.1 : 0
  const uInterest   = uMonthsN > 0 ? uBase * 0.015 * uMonthsN : 0
  const uTotal      = uBase + uAdditional + uInterest

  const grandTotal = tTotal + pTotal + (includeUnused ? uTotal : 0)

  // ── PDF Generation via html2canvas → jsPDF ───────────────────────────────
  const generatePDF = async () => {
    const el = pdfRef.current
    if (!el) return
    setIsGenerating(true)

    try {
      // Load both libraries in parallel
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      // Briefly surface the template at viewport origin so html2canvas
      // can reliably compute all styles and render correctly.
      const saved = { position: el.style.position, top: el.style.top, left: el.style.left, zIndex: el.style.zIndex }
      el.style.position = 'fixed'
      el.style.top      = '0'
      el.style.left     = '0'
      el.style.zIndex   = '99999'

      // Wait two animation frames so the browser has painted the element
      await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))

      const canvas = await html2canvas(el, {
        scale:           2,          // retina quality
        useCORS:         true,
        logging:         false,
        backgroundColor: '#0a0908',
        width:           794,
        height:          1123,
      })

      // Restore off-screen position
      el.style.position = saved.position
      el.style.top      = saved.top
      el.style.left     = saved.left
      el.style.zIndex   = saved.zIndex

      const imgData = canvas.toDataURL('image/jpeg', 0.93)
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      doc.addImage(imgData, 'JPEG', 0, 0, 210, 297)
      doc.save('KH_Property_Tax_Estimate.pdf')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── PDF Template data arrays ──────────────────────────────────────────────
  const tPdfRows: PdfDataRow[] = [
    ...tLands.map((r, i) => ({ name: `Land ${i + 1}`,  size: r.size, price: r.price })),
    ...tFloors.map((r, i) => ({ name: `Floor ${i}`,    size: r.size, price: r.price })),
  ]
  const pPdfRows: PdfDataRow[] = [
    ...pLands.map((r, i) => ({ name: `Land ${i + 1}`,  size: r.size, price: r.price })),
    ...pFloors.map((r, i) => ({ name: `Floor ${i}`,    size: r.size, price: r.price })),
  ]
  const uPdfRows: PdfDataRow[] = uLands.map((r, i) => ({ name: `Land ${i + 1}`, size: r.size, price: r.price }))

  const tCalcItems: PdfCalcItem[] = [
    { label: 'Subtotal', value: fmt(tSub, 0) },
    {
      label: tExemptOn ? `Exemption Applied  ($${n(tExemptAmt).toLocaleString('en')})` : 'No Exemption',
      value: tExemptOn ? `−${fmt(tExemption, 0)}` : '$0.00', indent: true,
    },
    { label: 'Taxable Amount',        value: fmt(tAfterEx, 0) },
    { label: 'Transfer Tax  (4%)',    value: fmt(tTax),    indent: true },
    { label: '+ $100 Registration Fee', value: '$100.00', indent: true },
  ]

  const pCalcItems: PdfCalcItem[] = [
    { label: 'Subtotal', value: fmt(pSub, 0) },
    { label: '× 80% of Value',  value: fmt(p80, 0),  indent: true },
    {
      label: pExemptOn ? `Exemption Applied  ($${n(pExemptAmt).toLocaleString('en')})` : 'No Exemption',
      value: pExemptOn ? `−${fmt(pExemption, 0)}` : '$0.00', indent: true,
    },
    { label: 'Taxable Base',         value: fmt(pBase, 0) },
    { label: 'Annual Tax  (0.1%)',   value: fmt(pAnnual) },
    ...(pMonthsN > 0
      ? [
          { label: `+ 10% Additional Tax`, value: fmt(pAdditional), indent: true },
          { label: `+ 1.5%/month × ${pMonthsN} months`, value: fmt(pInterest), indent: true },
        ]
      : [{ label: 'No Overdue Penalties', value: '$0.00', indent: true, muted: true }]
    ),
  ]

  const uCalcItems: PdfCalcItem[] = [
    { label: 'Subtotal',              value: fmt(uSub, 0) },
    { label: 'Unused Land Tax  (2%)', value: fmt(uBase) },
    ...(uMonthsN > 0
      ? [
          { label: `+ 10% Additional Tax`, value: fmt(uAdditional), indent: true },
          { label: `+ 1.5%/month × ${uMonthsN} months`, value: fmt(uInterest), indent: true },
        ]
      : [{ label: 'No Overdue Penalties', value: '$0.00', indent: true, muted: true }]
    ),
  ]

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ════════════════════════════════════════ VISIBLE APP UI ═══════════ */}
      <div className="page">

        {/* Header */}
        <motion.header className="header"
          initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}>
          <div className="header-icon"><Calculator size={26} /></div>
          <h1>KH Property Tax &amp; Transfer Fee Estimator</h1>
        </motion.header>

        {/* Mode toggle */}
        <motion.div className="mode-toggle"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}>
          <button type="button" className={`mode-btn${!includeUnused ? ' active' : ''}`}
            onClick={() => setIncludeUnused(false)}>Transfer + Property</button>
          <button type="button" className={`mode-btn${includeUnused ? ' active' : ''}`}
            onClick={() => setIncludeUnused(true)}>All Three Taxes</button>
        </motion.div>

        {/* ── Transfer Tax ─────────────────────────────────────────────── */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }}>
          <div className="card-header">
            <MapPin size={16} className="card-icon" />
            <div>
              <div className="card-title">Transfer Tax</div>
              <div className="card-subtitle">4% of value after exemption + $100 public fee</div>
            </div>
          </div>
          <RowList rows={tLands} singular="Land" sectionLabel="LAND PARCELS" baseIndex={1}
            onAdd={() => addRow(setTLands)} onRemove={id => removeRow(setTLands, id)}
            onUpdate={(id, f, v) => updateRow(setTLands, id, f, v)} addLabel="Add Land" />
          <RowList rows={tFloors} singular="Floor" sectionLabel="BUILDING FLOORS" baseIndex={0}
            onAdd={() => addRow(setTFloors)} onRemove={id => removeRow(setTFloors, id)}
            onUpdate={(id, f, v) => updateRow(setTFloors, id, f, v)} addLabel="Add Floor" />
          <div className="calc-summary">
            <CalcLine label="Subtotal" value={fmt(tSub, 0)} />
            <ExemptionLine enabled={tExemptOn} amount={tExemptAmt}
              onToggle={() => setTExemptOn(v => !v)} onAmountChange={setTExemptAmt} />
            <CalcLine label="Taxable Amount" value={fmt(tAfterEx, 0)} />
            <CalcLine label="Transfer Tax (4%)" value={fmt(tTax)} indent />
            <CalcLine label="+ $100 Public Fee" value="+ $100" indent />
            <CalcLine label="Transfer Tax Total" value={fmt(tTotal)} highlight />
          </div>
        </motion.div>

        {/* ── Property Tax ─────────────────────────────────────────────── */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.3 }}>
          <div className="card-header">
            <Building2 size={16} className="card-icon" />
            <div>
              <div className="card-title">Property Tax</div>
              <div className="card-subtitle">0.1% annual on 80% of value after exemption</div>
            </div>
          </div>
          <RowList rows={pLands} singular="Land" sectionLabel="LAND PARCELS" baseIndex={1}
            onAdd={() => addRow(setPLands)} onRemove={id => removeRow(setPLands, id)}
            onUpdate={(id, f, v) => updateRow(setPLands, id, f, v)} addLabel="Add Land" />
          <RowList rows={pFloors} singular="Floor" sectionLabel="BUILDING FLOORS" baseIndex={0}
            onAdd={() => addRow(setPFloors)} onRemove={id => removeRow(setPFloors, id)}
            onUpdate={(id, f, v) => updateRow(setPFloors, id, f, v)} addLabel="Add Floor" />
          <div className="months-row">
            <label className="months-label">Number of Months Overdue</label>
            <input type="number" inputMode="numeric" value={pMonths}
              onChange={e => setPMonths(e.target.value)} min="0" className="months-input" />
          </div>
          <div className="calc-summary">
            <CalcLine label="Subtotal" value={fmt(pSub, 0)} />
            <CalcLine label="× 80% of Value" value={fmt(p80, 0)} indent />
            <ExemptionLine enabled={pExemptOn} amount={pExemptAmt}
              onToggle={() => setPExemptOn(v => !v)} onAmountChange={setPExemptAmt} />
            <CalcLine label="Taxable Base" value={fmt(pBase, 0)} />
            <CalcLine label="Annual Tax (0.1%)" value={fmt(pAnnual)} />
            {pMonthsN > 0 ? (
              <>
                <CalcLine label="+ 10% Additional Tax" value={fmt(pAdditional)} indent />
                <CalcLine label={`+ 1.5%/month × ${pMonthsN} months`} value={fmt(pInterest)} indent />
              </>
            ) : (
              <div className="no-penalty-note">No overdue penalties (0 months)</div>
            )}
            <CalcLine label="Property Tax Total" value={fmt(pTotal)} highlight />
          </div>
        </motion.div>

        {/* ── Unused Land Tax ──────────────────────────────────────────── */}
        <motion.div className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: includeUnused ? 1 : 0.32, y: 0 }}
          transition={{ duration: 0.45, delay: 0.4 }}
          style={{ pointerEvents: includeUnused ? 'auto' : 'none' }}>
          <div className="card-header">
            <Leaf size={16} className="card-icon card-icon-amber" />
            <div>
              <div className="card-title">Unused Land Tax</div>
              <div className="card-subtitle">2% of land value + overdue penalties if applicable</div>
            </div>
          </div>
          <RowList rows={uLands} singular="Land" sectionLabel="LAND PARCELS" baseIndex={1}
            onAdd={() => addRow(setULands)} onRemove={id => removeRow(setULands, id)}
            onUpdate={(id, f, v) => updateRow(setULands, id, f, v)} addLabel="Add Land" />
          <div className="months-row">
            <label className="months-label">Number of Months Overdue</label>
            <input type="number" inputMode="numeric" value={uMonths}
              onChange={e => setUMonths(e.target.value)} min="0" className="months-input" />
          </div>
          <div className="calc-summary">
            <CalcLine label="Subtotal" value={fmt(uSub, 0)} />
            <CalcLine label="Unused Land Tax (2%)" value={fmt(uBase)} />
            {uMonthsN > 0 ? (
              <>
                <CalcLine label="+ 10% Additional Tax" value={fmt(uAdditional)} indent />
                <CalcLine label={`+ 1.5%/month × ${uMonthsN} months`} value={fmt(uInterest)} indent />
              </>
            ) : (
              <div className="no-penalty-note">No overdue penalties (0 months)</div>
            )}
            <CalcLine label="Unused Land Total" value={fmt(uTotal)} highlight />
          </div>
        </motion.div>

        {/* ── Grand Total ──────────────────────────────────────────────── */}
        <motion.div className="total-card"
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.5 }}>
          <div className="total-breakdown">
            <div className="breakdown-row"><span>Transfer Tax</span><span>{fmt(tTotal)}</span></div>
            <div className="breakdown-row"><span>Property Tax</span><span>{fmt(pTotal)}</span></div>
            <AnimatePresence>
              {includeUnused && (
                <motion.div className="breakdown-row"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                  <span>Unused Land Tax</span><span>{fmt(uTotal)}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="total-divider" />
          <div className="total-final-row">
            <div>
              <div className="total-label">Total Estimated Tax</div>
              <motion.div className="total-amount" key={grandTotal.toFixed(2)}
                initial={{ scale: 1.04 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}>
                {fmt(grandTotal)}
              </motion.div>
            </div>
            <div className="live-badge">● Live</div>
          </div>
        </motion.div>

        {/* ── PDF Button ──────────────────────────────────────────────── */}
        <motion.button type="button" className="pdf-btn" onClick={generatePDF}
          disabled={isGenerating}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          whileTap={{ scale: 0.98 }}>
          <FileDown size={18} />
          {isGenerating ? 'Generating PDF…' : 'Download Summary as PDF'}
        </motion.button>

      </div>

      {/* ════════════════════════════════════ HIDDEN PDF TEMPLATE ══════════
          794 × 1123 px = A4 portrait at 96 dpi.
          Positioned off-screen. Surfaces briefly during html2canvas capture.
          NO lucide icons, NO checkboxes, NO SVG — plain text only.
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        ref={pdfRef}
        aria-hidden="true"
        style={{
          position:   'fixed',
          top:        0,
          left:       '-9999px',
          zIndex:     -1,
          width:      '794px',
          height:     '1123px',
          overflow:   'hidden',
          background: '#0a0908',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          color:      '#f0e6c8',
          display:    'flex',
          flexDirection: 'column',
          boxSizing:  'border-box',
          pointerEvents: 'none',
        }}
      >
        {/* ── PDF Header ─────────────────────────────────────────────────── */}
        <div style={{
          background:   '#141210',
          borderBottom: '2px solid #c9a84c',
          padding:      '20px 36px 16px',
          flexShrink:   0,
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#e8d48b', letterSpacing: '-0.3px', marginBottom: 8 }}>
            KH Property Tax &amp; Transfer Fee Estimator
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8a7a5c' }}>
            <span>
              Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span>Mode: {includeUnused ? 'All Three Taxes' : 'Transfer + Property Tax'}</span>
          </div>
        </div>

        {/* ── PDF Body — flex column, space-between fills the full A4 height ── */}
        <div style={{
          flex:          1,
          display:       'flex',
          flexDirection: 'column',
          justifyContent:'space-between',
          padding:       '18px 32px',
          gap:           0,
          minHeight:     0,
        }}>

          {/* TRANSFER TAX */}
          <PdfSection title="TRANSFER TAX" subtitle="4% of taxable value after exemption + $100 public registration fee" accent="#c9a84c">
            <PdfTable rows={tPdfRows} />
            <PdfCalcBlock items={tCalcItems} total={{ label: 'TRANSFER TAX TOTAL', value: fmt(tTotal) }} />
          </PdfSection>

          {/* PROPERTY TAX */}
          <PdfSection title="PROPERTY TAX" subtitle="0.1% annual on 80% of assessed value after exemption" accent="#5a9a7a">
            {/* Months note — plain text, no input or checkbox */}
            <div style={{ fontSize: 11, color: '#7a6a4a', padding: '5px 16px 4px', background: '#191510', borderBottom: '1px solid rgba(201,168,76,0.07)' }}>
              Months Overdue: <strong style={{ color: pMonthsN > 0 ? '#e09040' : '#8a7a5c' }}>{pMonthsN}</strong>
              {pMonthsN === 0 ? '  —  No penalties apply' : '  —  Penalties apply'}
            </div>
            <PdfTable rows={pPdfRows} />
            <PdfCalcBlock items={pCalcItems} total={{ label: 'PROPERTY TAX TOTAL', value: fmt(pTotal) }} />
          </PdfSection>

          {/* UNUSED LAND TAX — only when mode includes it */}
          {includeUnused && (
            <PdfSection title="UNUSED LAND TAX" subtitle="2% of land value + 10% additional tax + 1.5%/month overdue interest" accent="#c98c4c">
              <div style={{ fontSize: 11, color: '#7a6a4a', padding: '5px 16px 4px', background: '#191510', borderBottom: '1px solid rgba(201,168,76,0.07)' }}>
                Months Overdue: <strong style={{ color: uMonthsN > 0 ? '#e09040' : '#8a7a5c' }}>{uMonthsN}</strong>
                {uMonthsN === 0 ? '  —  No penalties apply' : '  —  Penalties apply'}
              </div>
              <PdfTable rows={uPdfRows} />
              <PdfCalcBlock items={uCalcItems} total={{ label: 'UNUSED LAND TAX TOTAL', value: fmt(uTotal) }} />
            </PdfSection>
          )}

          {/* GRAND TOTAL BOX */}
          <div style={{
            background:   '#141210',
            border:       '1px solid rgba(201,168,76,0.28)',
            borderTop:    '2px solid #c9a84c',
            borderRadius: 10,
            padding:      '16px 24px 18px',
            flexShrink:   0,
          }}>
            {/* Per-tax breakdown row */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 14 }}>
              {[
                { label: 'Transfer Tax',     value: fmt(tTotal) },
                { label: 'Property Tax',     value: fmt(pTotal) },
                ...(includeUnused ? [{ label: 'Unused Land Tax', value: fmt(uTotal) }] : []),
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#7a6a4a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#c9a84c' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(201,168,76,0.2)', marginBottom: 14 }} />
            {/* Grand total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8a7a5c', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Total Estimated Tax
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#c9a84c', letterSpacing: '-0.8px' }}>
                {fmt(grandTotal)}
              </div>
            </div>
          </div>

        </div>

        {/* ── PDF Footer ─────────────────────────────────────────────────── */}
        <div style={{
          padding:    '10px 32px',
          fontSize:   9.5,
          color:      '#4a3e28',
          textAlign:  'center',
          borderTop:  '1px solid rgba(201,168,76,0.08)',
          flexShrink: 0,
        }}>
          This document is an estimate only. Consult a licensed tax professional for official calculations.
        </div>
      </div>
    </>
  )
}
