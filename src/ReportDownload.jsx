import { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate()

const yearOptions = (() => {
  const current = new Date().getFullYear()
  const years = []
  for (let y = current - 5; y <= current + 1; y += 1) years.push(y)
  return years
})()

const pad2 = (n) => String(n).padStart(2, '0')

const formatDate = (year, monthIndex, day) =>
  `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`

// Deterministic pseudo-random generator seeded by the date, so the
// same date always downloads the same sample values.
const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const sampleForDate = (year, monthIndex, day) => {
  const seed = year * 10000 + (monthIndex + 1) * 100 + day
  const rand = mulberry32(seed)
  const money = Math.round(5000 + rand() * 45000)
  const kl = Math.round(100 + rand() * 900)
  const tankers = 1 + Math.floor(rand() * 6)
  return { date: formatDate(year, monthIndex, day), money, kl, tankers }
}

const downloadPDF = (filename, title, rows, includeTotal) => {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text(title, 14, 16)

  const body = rows.map((r) => [
    r.date,
    r.money.toLocaleString(),
    r.kl.toLocaleString(),
    String(r.tankers),
  ])

  if (includeTotal) {
    const totalMoney = rows.reduce((sum, r) => sum + r.money, 0)
    const totalKL = rows.reduce((sum, r) => sum + r.kl, 0)
    const totalTankers = rows.reduce((sum, r) => sum + r.tankers, 0)
    body.push([
      'TOTAL',
      totalMoney.toLocaleString(),
      totalKL.toLocaleString(),
      String(totalTankers),
    ])
  }

  autoTable(doc, {
    startY: 24,
    head: [['Date', 'Total Money', 'Total KL', 'Total Tankers']],
    body,
    didParseCell: (data) => {
      if (includeTotal && data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  doc.save(filename)
}

function DateSelect({ year, monthIndex, day, onChange }) {
  const dayCount = daysInMonth(year, monthIndex)

  return (
    <div className="date-selects">
      <select
        aria-label="Year"
        value={year}
        onChange={(e) => onChange({ year: Number(e.target.value), monthIndex, day })}
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        aria-label="Month"
        value={monthIndex}
        onChange={(e) => {
          const nextMonth = Number(e.target.value)
          const nextDayCount = daysInMonth(year, nextMonth)
          onChange({ year, monthIndex: nextMonth, day: Math.min(day, nextDayCount) })
        }}
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i}>
            {m}
          </option>
        ))}
      </select>
      <select
        aria-label="Day"
        value={day}
        onChange={(e) => onChange({ year, monthIndex, day: Number(e.target.value) })}
      >
        {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  )
}

function ReportDownload() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('single')

  const today = new Date()
  const [single, setSingle] = useState({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
    day: today.getDate(),
  })
  const [start, setStart] = useState({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
    day: today.getDate(),
  })
  const [end, setEnd] = useState({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
    day: today.getDate(),
  })

  const handleDownload = () => {
    if (mode === 'single') {
      const row = sampleForDate(single.year, single.monthIndex, single.day)
      downloadPDF(`daily-report-${row.date}.pdf`, `Daily Report - ${row.date}`, [row], false)
      return
    }

    const startDate = new Date(start.year, start.monthIndex, start.day)
    const endDate = new Date(end.year, end.monthIndex, end.day)

    if (startDate > endDate) {
      window.alert('Start date must be on or before end date.')
      return
    }

    const rows = []
    const cursor = new Date(startDate)
    while (cursor <= endDate) {
      rows.push(sampleForDate(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()))
      cursor.setDate(cursor.getDate() + 1)
    }

    const rangeLabel = `${rows[0].date} to ${rows[rows.length - 1].date}`
    downloadPDF(
      `report-${rows[0].date}_to_${rows[rows.length - 1].date}.pdf`,
      `Range Report - ${rangeLabel}`,
      rows,
      true,
    )
  }

  return (
    <div className="calendar-wrap">
      <button
        type="button"
        className="calendar-btn"
        onClick={() => setOpen((o) => !o)}
      >
        📅 Calendar
      </button>

      {open && (
        <div className="calendar-panel">
          <div className="mode-toggle">
            <button
              type="button"
              className={mode === 'single' ? 'active' : ''}
              onClick={() => setMode('single')}
            >
              Single Day
            </button>
            <button
              type="button"
              className={mode === 'range' ? 'active' : ''}
              onClick={() => setMode('range')}
            >
              Range
            </button>
          </div>

          {mode === 'single' && (
            <DateSelect {...single} onChange={setSingle} />
          )}

          {mode === 'range' && (
            <>
              <p className="range-label">Start Date</p>
              <DateSelect {...start} onChange={setStart} />
              <p className="range-label">End Date</p>
              <DateSelect {...end} onChange={setEnd} />
            </>
          )}

          <button type="button" className="download-btn" onClick={handleDownload}>
            ⬇ Download PDF
          </button>
        </div>
      )}
    </div>
  )
}

export default ReportDownload
