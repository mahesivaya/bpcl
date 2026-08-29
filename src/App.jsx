import { useEffect, useState } from 'react'
import AddUser from './AddUser.jsx'
import ReportDownload from './ReportDownload.jsx'
import { client } from './amplifyClient.js'

const toNumber = (value) => {
  const num = parseFloat(value)
  return Number.isNaN(num) ? 0 : num
}

const pad2 = (n) => String(n).padStart(2, '0')

const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function App({ signOut, user }) {
  const [now, setNow] = useState(new Date())

  const [moneyNineAM, setMoneyNineAM] = useState('')
  const [moneyTwelvePM, setMoneyTwelvePM] = useState('')

  const [currentKL, setCurrentKL] = useState('')
  const [newTankerKL, setNewTankerKL] = useState('')

  const [tankers, setTankers] = useState([''])

  const [saleKL, setSaleKL] = useState('')
  const [ratePerLiter, setRatePerLiter] = useState('')
  const [mobilePayment, setMobilePayment] = useState('')
  const [cashPayment, setCashPayment] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle')

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const totalMoney = toNumber(moneyNineAM) + toNumber(moneyTwelvePM)
  const totalKL = toNumber(currentKL) + toNumber(newTankerKL)
  const totalSaleAmount = toNumber(saleKL) * toNumber(ratePerLiter)
  const totalPayment = toNumber(mobilePayment) + toNumber(cashPayment)

  const handleTankerChange = (index, value) => {
    setTankers((prev) => prev.map((t, i) => (i === index ? value : t)))
  }

  const handleAddTanker = () => {
    setTankers((prev) => [...prev, ''])
  }

  const handleSave = async () => {
    setSaveStatus('saving')
    const date = todayISO()
    const record = {
      date,
      moneyNineAM: toNumber(moneyNineAM),
      moneyTwelvePM: toNumber(moneyTwelvePM),
      currentKL: toNumber(currentKL),
      newTankerKL: toNumber(newTankerKL),
      tankers: tankers.map(toNumber),
      saleKL: toNumber(saleKL),
      ratePerLiter: toNumber(ratePerLiter),
      mobilePayment: toNumber(mobilePayment),
      cashPayment: toNumber(cashPayment),
    }

    try {
      const { data: existing } = await client.models.DailyReport.get({ date })
      const { errors } = existing
        ? await client.models.DailyReport.update(record)
        : await client.models.DailyReport.create(record)

      if (errors) {
        setSaveStatus('error')
        return
      }
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
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
      <header className="page-header">
        <div className="header-account">
          <span>{user?.signInDetails?.loginId}</span>
          <AddUser />
          <button type="button" className="signout-btn" onClick={signOut}>
            Sign out
          </button>
        </div>
        <h1>Past Reports</h1>
        <p className="datetime">
          {dateStr} &middot; {timeStr}
        </p>
      </header>

      <ReportDownload />

      <div className="form-grid">
      <section className="section">
        <h2>Amount</h2>
        <label>
          9:00 AM
          <input
            type="text"
            inputMode="decimal"
            value={moneyNineAM}
            onChange={(e) => setMoneyNineAM(e.target.value)}
            placeholder="0"
          />
        </label>
        <label>
          12:00 PM
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
        <h2>Sale</h2>
        <label>
          KL
          <div className="input-unit">
            <input
              type="text"
              inputMode="decimal"
              value={saleKL}
              onChange={(e) => setSaleKL(e.target.value)}
              placeholder="0"
            />
            <span className="unit">KL</span>
          </div>
        </label>
        <label>
          Amount per /L
          <div className="input-unit">
            <input
              type="text"
              inputMode="decimal"
              value={ratePerLiter}
              onChange={(e) => setRatePerLiter(e.target.value)}
              placeholder="0"
            />
            <span className="unit">₹/L</span>
          </div>
        </label>
        <p className="total">Total Amount: {totalSaleAmount}</p>
      </section>

      <section className="section">
        <h2>Payment</h2>
        <label>
          Mobile Payment Amount
          <div className="input-unit">
            <input
              type="text"
              inputMode="decimal"
              value={mobilePayment}
              onChange={(e) => setMobilePayment(e.target.value)}
              placeholder="0"
            />
            <span className="unit">₹</span>
          </div>
        </label>
        <label>
          Cash Payment Amount
          <div className="input-unit">
            <input
              type="text"
              inputMode="decimal"
              value={cashPayment}
              onChange={(e) => setCashPayment(e.target.value)}
              placeholder="0"
            />
            <span className="unit">₹</span>
          </div>
        </label>
        <p className="total">Total Amount: {totalPayment}</p>
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

      <div className="save-actions">
        <button
          type="button"
          className="save-btn"
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? 'Saving...' : "Save Today's Report"}
        </button>
        {saveStatus === 'saved' && <p className="save-status success">Saved.</p>}
        {saveStatus === 'error' && (
          <p className="save-status error">Could not save. Please try again.</p>
        )}
      </div>
    </div>
  )
}

export default App
