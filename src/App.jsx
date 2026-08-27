import { useEffect, useState } from 'react'
import ReportDownload from './ReportDownload.jsx'

const toNumber = (value) => {
  const num = parseFloat(value)
  return Number.isNaN(num) ? 0 : num
}

function App() {
  const [now, setNow] = useState(new Date())

  const [moneyNineAM, setMoneyNineAM] = useState('')
  const [moneyTwelvePM, setMoneyTwelvePM] = useState('')

  const [currentKL, setCurrentKL] = useState('')
  const [newTankerKL, setNewTankerKL] = useState('')

  const [tankers, setTankers] = useState([''])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const totalMoney = toNumber(moneyNineAM) + toNumber(moneyTwelvePM)
  const totalKL = toNumber(currentKL) + toNumber(newTankerKL)

  const handleTankerChange = (index, value) => {
    setTankers((prev) => prev.map((t, i) => (i === index ? value : t)))
  }

  const handleAddTanker = () => {
    setTankers((prev) => [...prev, ''])
  }

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const timeStr = now.toLocaleTimeString()

  return (
    <div className="container">
      <h1>Daily Report</h1>
      <p className="datetime">
        {dateStr} &middot; {timeStr}
      </p>

      <ReportDownload />

      <section className="section">
        <h2>Money</h2>
        <label>
          9AM Money
          <input
            type="text"
            inputMode="decimal"
            value={moneyNineAM}
            onChange={(e) => setMoneyNineAM(e.target.value)}
            placeholder="0"
          />
        </label>
        <label>
          12PM Money
          <input
            type="text"
            inputMode="decimal"
            value={moneyTwelvePM}
            onChange={(e) => setMoneyTwelvePM(e.target.value)}
            placeholder="0"
          />
        </label>
        <p className="total">Total 24 Hours: {totalMoney}</p>
      </section>

      <section className="section">
        <h2>Kilo Liters</h2>
        <label>
          Current KL
          <div className="input-unit">
            <input
              type="text"
              inputMode="decimal"
              value={currentKL}
              onChange={(e) => setCurrentKL(e.target.value)}
              placeholder="0"
            />
            <span className="unit">KL</span>
          </div>
        </label>
        <label>
          New Tanker KL
          <div className="input-unit">
            <input
              type="text"
              inputMode="decimal"
              value={newTankerKL}
              onChange={(e) => setNewTankerKL(e.target.value)}
              placeholder="0"
            />
            <span className="unit">KL</span>
          </div>
        </label>
        <p className="total">Total Day: {totalKL}</p>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Total Tankers</h2>
          <button type="button" className="add-btn" onClick={handleAddTanker}>
            +
          </button>
        </div>
        {tankers.map((value, index) => (
          <label key={index}>
            Tanker {index + 1}
            <div className="input-unit">
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(e) => handleTankerChange(index, e.target.value)}
                placeholder="0"
              />
              <span className="unit">KL</span>
            </div>
          </label>
        ))}
      </section>
    </div>
  )
}

export default App
