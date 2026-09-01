import { useState } from 'react'
import AddUser from './AddUser.jsx'
import ReportDownload from './ReportDownload.jsx'
import { client } from './amplifyClient.js'

const toNumber = (value) => {
  const num = parseFloat(value)
  return Number.isNaN(num) ? 0 : num
}

const trunc2 = (num) => {
  const sign = num < 0 ? -1 : 1
  return (sign * Math.trunc(Math.abs(num) * 100 + 1e-9)) / 100
}

const fmt = (num) => {
  if (num === 0) return '0'
  return trunc2(num).toFixed(2)
}

const pad2 = (n) => String(n).padStart(2, '0')

const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function App({ signOut, user }) {
  const [now] = useState(new Date())

  const [hsdNozzle1Closing, setHsdNozzle1Closing] = useState('')
  const [hsdNozzle1Opening, setHsdNozzle1Opening] = useState('')
  const [hsdNozzle2Closing, setHsdNozzle2Closing] = useState('')
  const [hsdNozzle2Opening, setHsdNozzle2Opening] = useState('')

  const [msNozzle1Closing, setMsNozzle1Closing] = useState('')
  const [msNozzle1Opening, setMsNozzle1Opening] = useState('')
  const [msNozzle2Closing, setMsNozzle2Closing] = useState('')
  const [msNozzle2Opening, setMsNozzle2Opening] = useState('')

  const [hsdRate, setHsdRate] = useState('')
  const [msRate, setMsRate] = useState('')

  const [phonePay, setPhonePay] = useState('')
  const [cardPay, setCardPay] = useState('')

  const [ttPrice, setTtPrice] = useState('')
  const [ttSold, setTtSold] = useState('')

  const [note500, setNote500] = useState('')
  const [note200, setNote200] = useState('')
  const [note100, setNote100] = useState('')
  const [note50, setNote50] = useState('')
  const [note20, setNote20] = useState('')
  const [note10, setNote10] = useState('')
  const [coins, setCoins] = useState('')

  const [saveStatus, setSaveStatus] = useState('idle')

  const hsdAmount1 = trunc2(toNumber(hsdNozzle1Closing) - toNumber(hsdNozzle1Opening))
  const hsdAmount2 = trunc2(toNumber(hsdNozzle2Closing) - toNumber(hsdNozzle2Opening))
  const totalHSD = trunc2(hsdAmount1 + hsdAmount2)
  const msAmount1 = trunc2(toNumber(msNozzle1Closing) - toNumber(msNozzle1Opening))
  const msAmount2 = trunc2(toNumber(msNozzle2Closing) - toNumber(msNozzle2Opening))
  const totalMS = trunc2(msAmount1 + msAmount2)
  const hsdFinalAmount = trunc2(totalHSD * toNumber(hsdRate))
  const msFinalAmount = trunc2(totalMS * toNumber(msRate))
  const totalCollection = trunc2(hsdFinalAmount + msFinalAmount)
  const totalPayments = trunc2(toNumber(phonePay) + toNumber(cardPay))
  const ttAmount = trunc2(toNumber(ttPrice) * toNumber(ttSold))
  const finalTotal = trunc2(totalPayments + ttAmount)

  const value500 = trunc2(500 * toNumber(note500))
  const value200 = trunc2(200 * toNumber(note200))
  const value100 = trunc2(100 * toNumber(note100))
  const value50 = trunc2(50 * toNumber(note50))
  const value20 = trunc2(20 * toNumber(note20))
  const value10 = trunc2(10 * toNumber(note10))
  const valueCoins = trunc2(toNumber(coins))
  const totalCash = trunc2(
    value500 + value200 + value100 + value50 + value20 + value10 + valueCoins
  )

  const handleSave = async () => {
    setSaveStatus('saving')
    const date = todayISO()
    const record = {
      date,
      hsdNozzle1Closing: toNumber(hsdNozzle1Closing),
      hsdNozzle1Opening: toNumber(hsdNozzle1Opening),
      hsdNozzle2Closing: toNumber(hsdNozzle2Closing),
      hsdNozzle2Opening: toNumber(hsdNozzle2Opening),
      msNozzle1Closing: toNumber(msNozzle1Closing),
      msNozzle1Opening: toNumber(msNozzle1Opening),
      msNozzle2Closing: toNumber(msNozzle2Closing),
      msNozzle2Opening: toNumber(msNozzle2Opening),
      hsdRate: toNumber(hsdRate),
      msRate: toNumber(msRate),
      phonePay: toNumber(phonePay),
      cardPay: toNumber(cardPay),
      ttPrice: toNumber(ttPrice),
      ttSold: toNumber(ttSold),
      note500: toNumber(note500),
      note200: toNumber(note200),
      note100: toNumber(note100),
      note50: toNumber(note50),
      note20: toNumber(note20),
      note10: toNumber(note10),
      coins: toNumber(coins),
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
        <h1>G.N.Rao BPCL</h1>
        <div className="header-top">
          <div className="header-left">
            <ReportDownload />
            <p className="datetime">
              {dateStr} &middot; {timeStr}
            </p>
          </div>
          <div className="header-account">
            <span>{user?.signInDetails?.loginId}</span>
            <AddUser />
            <button type="button" className="signout-btn" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="form-grid">
      <section className="section">
        <h2>HSD</h2>
        <div className="xy-row">
          <label>
            X
            <input
              type="text"
              inputMode="decimal"
              value={hsdNozzle1Closing}
              onChange={(e) => setHsdNozzle1Closing(e.target.value)}
              placeholder="0"
            />
          </label>
          <span className="xy-sep">-</span>
          <label>
            Y
            <input
              type="text"
              inputMode="decimal"
              value={hsdNozzle1Opening}
              onChange={(e) => setHsdNozzle1Opening(e.target.value)}
              placeholder="0"
            />
          </label>
        </div>
        <p className="total">Amount: {fmt(hsdAmount1)}</p>
        <div className="xy-row">
          <label>
            X
            <input
              type="text"
              inputMode="decimal"
              value={hsdNozzle2Closing}
              onChange={(e) => setHsdNozzle2Closing(e.target.value)}
              placeholder="0"
            />
          </label>
          <span className="xy-sep">-</span>
          <label>
            Y
            <input
              type="text"
              inputMode="decimal"
              value={hsdNozzle2Opening}
              onChange={(e) => setHsdNozzle2Opening(e.target.value)}
              placeholder="0"
            />
          </label>
        </div>
        <p className="total">Amount: {fmt(hsdAmount2)}</p>
        <p className="total total-divider">HSD Total: {fmt(totalHSD)}</p>
      </section>

      <section className="section">
        <h2>MS</h2>
        <div className="xy-row">
          <label>
            X
            <input
              type="text"
              inputMode="decimal"
              value={msNozzle1Closing}
              onChange={(e) => setMsNozzle1Closing(e.target.value)}
              placeholder="0"
            />
          </label>
          <span className="xy-sep">-</span>
          <label>
            Y
            <input
              type="text"
              inputMode="decimal"
              value={msNozzle1Opening}
              onChange={(e) => setMsNozzle1Opening(e.target.value)}
              placeholder="0"
            />
          </label>
        </div>
        <p className="total">Amount: {fmt(msAmount1)}</p>
        <div className="xy-row">
          <label>
            X
            <input
              type="text"
              inputMode="decimal"
              value={msNozzle2Closing}
              onChange={(e) => setMsNozzle2Closing(e.target.value)}
              placeholder="0"
            />
          </label>
          <span className="xy-sep">-</span>
          <label>
            Y
            <input
              type="text"
              inputMode="decimal"
              value={msNozzle2Opening}
              onChange={(e) => setMsNozzle2Opening(e.target.value)}
              placeholder="0"
            />
          </label>
        </div>
        <p className="total">Amount: {fmt(msAmount2)}</p>
        <p className="total total-divider">MS Total: {fmt(totalMS)}</p>
      </section>

      <section className="section">
        <h2>Final Collection</h2>
        <label>
          HSD
          <div className="input-unit">
            <input
              type="text"
              inputMode="decimal"
              value={hsdRate}
              onChange={(e) => setHsdRate(e.target.value)}
              placeholder="Diesel"
            />
            <span className="unit">₹/L</span>
          </div>
        </label>
        <p className="total">HSD Amount: {fmt(hsdFinalAmount)}</p>
        <label>
          MS
          <div className="input-unit">
            <input
              type="text"
              inputMode="decimal"
              value={msRate}
              onChange={(e) => setMsRate(e.target.value)}
              placeholder="Petrol"
            />
            <span className="unit">₹/L</span>
          </div>
        </label>
        <p className="total">MS Amount: {fmt(msFinalAmount)}</p>
        <p className="total">Final HSD+MS = {fmt(totalCollection)}</p>
      </section>

      <section className="section">
        <h2>Payment</h2>
        <label>
          Phone Pay
          <div className="input-unit">
            <input
              type="text"
              inputMode="decimal"
              value={phonePay}
              onChange={(e) => setPhonePay(e.target.value)}
              placeholder="0"
            />
            <span className="unit">₹</span>
          </div>
        </label>
        <label>
          Card Pay
          <div className="input-unit">
            <input
              type="text"
              inputMode="decimal"
              value={cardPay}
              onChange={(e) => setCardPay(e.target.value)}
              placeholder="0"
            />
            <span className="unit">₹</span>
          </div>
        </label>
        <p className="total">Total payments: {fmt(totalPayments)}</p>
      </section>

      <section className="section">
        <h2>2TT</h2>
        <label>
          2TT price
          <div className="input-unit">
            <input
              type="text"
              inputMode="decimal"
              value={ttPrice}
              onChange={(e) => setTtPrice(e.target.value)}
              placeholder="0"
            />
            <span className="unit">₹</span>
          </div>
        </label>
        <label>
          2TT sold
          <input
            type="text"
            inputMode="decimal"
            value={ttSold}
            onChange={(e) => setTtSold(e.target.value)}
            placeholder="0"
          />
        </label>
        <p className="total">2TT Amount: {fmt(ttAmount)}</p>
      </section>

      <section className="section">
        <h2>Final</h2>
        <p className={`total ${finalTotal >= 0 ? 'positive' : 'negative'}`}>
          Final: {fmt(finalTotal)}
        </p>
      </section>

      <section className="section section-wide">
        <h2>Denomination</h2>
        <div className="denom-grid">
          <div className="denom-row">
            <label>
              500 x
              <input
                type="text"
                inputMode="decimal"
                value={note500}
                onChange={(e) => setNote500(e.target.value)}
                placeholder="0"
              />
            </label>
            <span className="denom-value">= {fmt(value500)}</span>
          </div>
          <div className="denom-row">
            <label>
              200 x
              <input
                type="text"
                inputMode="decimal"
                value={note200}
                onChange={(e) => setNote200(e.target.value)}
                placeholder="0"
              />
            </label>
            <span className="denom-value">= {fmt(value200)}</span>
          </div>
          <div className="denom-row">
            <label>
              100 x
              <input
                type="text"
                inputMode="decimal"
                value={note100}
                onChange={(e) => setNote100(e.target.value)}
                placeholder="0"
              />
            </label>
            <span className="denom-value">= {fmt(value100)}</span>
          </div>
          <div className="denom-row">
            <label>
              50 x
              <input
                type="text"
                inputMode="decimal"
                value={note50}
                onChange={(e) => setNote50(e.target.value)}
                placeholder="0"
              />
            </label>
            <span className="denom-value">= {fmt(value50)}</span>
          </div>
          <div className="denom-row">
            <label>
              20 x
              <input
                type="text"
                inputMode="decimal"
                value={note20}
                onChange={(e) => setNote20(e.target.value)}
                placeholder="0"
              />
            </label>
            <span className="denom-value">= {fmt(value20)}</span>
          </div>
          <div className="denom-row">
            <label>
              10 x
              <input
                type="text"
                inputMode="decimal"
                value={note10}
                onChange={(e) => setNote10(e.target.value)}
                placeholder="0"
              />
            </label>
            <span className="denom-value">= {fmt(value10)}</span>
          </div>
          <div className="denom-row">
            <label>
              Coins
              <input
                type="text"
                inputMode="decimal"
                value={coins}
                onChange={(e) => setCoins(e.target.value)}
                placeholder="0"
              />
            </label>
            <span className="denom-value">= {fmt(valueCoins)}</span>
          </div>
        </div>
        <p className="total">Total cash: {fmt(totalCash)}</p>
      </section>

      </div>

      <div className="save-actions">
        <button
          type="button"
          className="save-btn"
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save and Download'}
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
