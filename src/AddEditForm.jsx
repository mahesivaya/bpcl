import { useEffect, useRef, useState } from 'react'
import { client } from './amplifyClient.js'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MIN_YEAR = 2026
const MIN_MONTH_INDEX = 7 // August

const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate()

const yearOptions = (() => {
  const current = new Date().getFullYear()
  const years = []
  for (let y = MIN_YEAR; y <= Math.max(current + 1, MIN_YEAR); y += 1) years.push(y)
  return years
})()

const monthOptionsFor = (year) =>
  year === MIN_YEAR
    ? MONTHS.map((m, i) => ({ name: m, index: i })).slice(MIN_MONTH_INDEX)
    : MONTHS.map((m, i) => ({ name: m, index: i }))

const pad2 = (n) => String(n).padStart(2, '0')

const formatDate = (year, monthIndex, day) =>
  `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`

function DateSelect({ year, monthIndex, day, onChange }) {
  const dayCount = daysInMonth(year, monthIndex)

  return (
    <div className="date-selects">
      <select
        aria-label="Year"
        value={year}
        onChange={(e) => {
          const nextYear = Number(e.target.value)
          const nextMonthOptions = monthOptionsFor(nextYear)
          const nextMonth = nextMonthOptions.some((m) => m.index === monthIndex)
            ? monthIndex
            : nextMonthOptions[0].index
          const nextDayCount = daysInMonth(nextYear, nextMonth)
          onChange({ year: nextYear, monthIndex: nextMonth, day: Math.min(day, nextDayCount) })
        }}
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
        {monthOptionsFor(year).map(({ name, index }) => (
          <option key={name} value={index}>
            {name}
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

function AddEditForm({ onLoad, label = '➕ Add' }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef(null)

  const today = new Date()
  const defaultYear = Math.max(today.getFullYear(), MIN_YEAR)
  const defaultMonthIndex =
    defaultYear === MIN_YEAR ? Math.max(today.getMonth(), MIN_MONTH_INDEX) : today.getMonth()
  const [picked, setPicked] = useState({
    year: defaultYear,
    monthIndex: defaultMonthIndex,
    day: defaultYear === today.getFullYear() && defaultMonthIndex === today.getMonth()
      ? today.getDate()
      : 1,
  })

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

  const handleLoad = async () => {
    setLoading(true)
    try {
      const date = formatDate(picked.year, picked.monthIndex, picked.day)
      const { data: record } = await client.models.DailyReport.get({ date })
      onLoad(record || { date })
      setOpen(false)
    } catch {
      window.alert('Could not fetch report data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="calendar-wrap" ref={wrapRef}>
      <button
        type="button"
        className="calendar-btn"
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </button>

      {open && (
        <div className="calendar-panel">
          <DateSelect {...picked} onChange={setPicked} />
          <button
            type="button"
            className="edit-btn"
            onClick={handleLoad}
            disabled={loading}
          >
            {loading ? 'Loading...' : '✏ Load into form'}
          </button>
        </div>
      )}
    </div>
  )
}

export default AddEditForm
