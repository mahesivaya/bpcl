import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { client } from './amplifyClient.js'

const n = (value) => (typeof value === 'number' && !Number.isNaN(value) ? value : 0)

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const pad2 = (num) => String(num).padStart(2, '0')

const shortLabel = (date) => {
  const [, , day] = date.split('-')
  return day
}

const tooltipLabel = (date) => {
  const [, month, day] = date.split('-')
  return `${SHORT_MONTH_NAMES[Number(month) - 1]} ${Number(day)}`
}

const MIN_YEAR = 2026
const MIN_MONTH_INDEX = 7 // August

const yearOptions = (() => {
  const current = new Date().getFullYear()
  const years = []
  for (let y = MIN_YEAR; y <= Math.max(current + 1, MIN_YEAR); y += 1) years.push(y)
  return years
})()

const monthOptionsFor = (year) =>
  year === MIN_YEAR
    ? MONTH_NAMES.map((m, i) => ({ name: m, index: i })).slice(MIN_MONTH_INDEX)
    : MONTH_NAMES.map((m, i) => ({ name: m, index: i }))

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [allRows, setAllRows] = useState([])

  const today = new Date()
  const defaultYear = Math.max(today.getFullYear(), MIN_YEAR)
  const defaultMonthIndex =
    defaultYear === MIN_YEAR ? Math.max(today.getMonth(), MIN_MONTH_INDEX) : today.getMonth()
  const [selectedYear, setSelectedYear] = useState(defaultYear)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(defaultMonthIndex)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)

      let records = []
      let nextToken = null
      do {
        const { data, nextToken: token } = await client.models.DailyReport.list({
          nextToken,
        })
        records = records.concat(data)
        nextToken = token
      } while (nextToken)

      if (cancelled) return

      const data = records
        .slice()
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
        .map((record) => {
          const dieselSale =
            Math.abs(n(record.hsdNozzle1Closing) - n(record.hsdNozzle1Opening)) +
            Math.abs(n(record.hsdNozzle2Closing) - n(record.hsdNozzle2Opening))
          const petrolSale =
            Math.abs(n(record.msNozzle1Closing) - n(record.msNozzle1Opening)) +
            Math.abs(n(record.msNozzle2Closing) - n(record.msNozzle2Opening))

          return {
            date: record.date,
            label: shortLabel(record.date),
            diesel: Math.round(dieselSale),
            petrol: Math.round(petrolSale),
            total: Math.round(dieselSale + petrolSale),
          }
        })

      setAllRows(data)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const monthPrefix = `${selectedYear}-${pad2(selectedMonthIndex + 1)}`
  const rows = useMemo(
    () => allRows.filter((r) => r.date.startsWith(monthPrefix)),
    [allRows, monthPrefix],
  )

  const monthPicker = (
    <div className="dashboard-month-picker">
      <select
        aria-label="Month"
        value={selectedMonthIndex}
        onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
      >
        {monthOptionsFor(selectedYear).map(({ name, index }) => (
          <option key={name} value={index}>
            {name}
          </option>
        ))}
      </select>
      <select
        aria-label="Year"
        value={selectedYear}
        onChange={(e) => {
          const nextYear = Number(e.target.value)
          const nextOptions = monthOptionsFor(nextYear)
          if (!nextOptions.some((m) => m.index === selectedMonthIndex)) {
            setSelectedMonthIndex(nextOptions[0].index)
          }
          setSelectedYear(nextYear)
        }}
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  )

  if (loading) {
    return <p className="dashboard-status">Loading saved reports...</p>
  }

  return (
    <div className="dashboard">
      {monthPicker}
      {rows.length === 0 ? (
        <p className="dashboard-status">
          No saved reports for {MONTH_NAMES[selectedMonthIndex]} {selectedYear}.
        </p>
      ) : (
        <div className="dashboard-chart">
          <h2>
            Diesel vs Petrol sale per day &middot; {MONTH_NAMES[selectedMonthIndex]}{' '}
            {selectedYear}
          </h2>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={12} interval="preserveStartEnd" />
              <YAxis fontSize={12} />
              <Tooltip
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload ? tooltipLabel(payload[0].payload.date) : ''
                }
              />
              <Legend />
              <Line type="monotone" dataKey="diesel" name="Diesel sale" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="petrol" name="Petrol sale" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="total" name="Total sale" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default Dashboard
