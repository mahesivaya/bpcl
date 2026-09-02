import { useEffect, useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { client } from './amplifyClient.js'
import { buildDailyReportPDF } from './reportPdf.js'

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

const fetchRowForDate = async (year, monthIndex, day) => {
  const date = formatDate(year, monthIndex, day)
  const { data: record } = await client.models.DailyReport.get({ date })

  if (!record) {
    return { date, money: 0, kl: 0, tankers: 0 }
  }

  const money =
    ((record.hsdNozzle1Closing || 0) - (record.hsdNozzle1Opening || 0)) +
    ((record.hsdNozzle2Closing || 0) - (record.hsdNozzle2Opening || 0))
  const kl = (record.currentKL || 0) + (record.newTankerKL || 0)
  const tankers = record.tankers ? record.tankers.length : 0
  return { date, money, kl, tankers }
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
  const [downloading, setDownloading] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

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

  const handleDownload = async () => {
    setDownloading(true)
    try {
      if (mode === 'single') {
        const date = formatDate(single.year, single.monthIndex, single.day)
        const { data: record } = await client.models.DailyReport.get({ date })
        if (!record) {
          window.alert(`No saved report found for ${date}.`)
          return
        }
        buildDailyReportPDF(record)
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
        rows.push(await fetchRowForDate(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()))
        cursor.setDate(cursor.getDate() + 1)
      }

      const rangeLabel = `${rows[0].date} to ${rows[rows.length - 1].date}`
      downloadPDF(
        `report-${rows[0].date}_to_${rows[rows.length - 1].date}.pdf`,
        `Range Report - ${rangeLabel}`,
        rows,
        true,
      )
    } catch {
      window.alert('Could not fetch report data. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="calendar-wrap" ref={wrapRef}>
      <button
        type="button"
        className="calendar-btn"
        onClick={() => setOpen((o) => !o)}
      >
        📅 Past Reports
      </button>

      {open && (
        <div className="calendar-panel">
          <div className="mode-toggle">
            <button
              type="button"
              className={mode === 'single' ? 'active' : ''}
              onClick={() => setMode('single')}
            >
              Day
            </button>
            <button
              type="button"
              className={mode === 'range' ? 'active' : ''}
              onClick={() => setMode('range')}
              disabled
              title="Range download is temporarily disabled"
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

          <button
            type="button"
            className="download-btn"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Fetching...' : '⬇ Download PDF'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ReportDownload
