import { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
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

  const [comment, setComment] = useState('')

  const [saveStatus, setSaveStatus] = useState('idle')

  const hsdAmount1 = toNumber(hsdNozzle1Closing) - toNumber(hsdNozzle1Opening)
  const hsdAmount2 = toNumber(hsdNozzle2Closing) - toNumber(hsdNozzle2Opening)
  const totalHSD = hsdAmount1 + hsdAmount2
  const msAmount1 = toNumber(msNozzle1Closing) - toNumber(msNozzle1Opening)
  const msAmount2 = toNumber(msNozzle2Closing) - toNumber(msNozzle2Opening)
  const totalMS = msAmount1 + msAmount2
  const hsdFinalAmount = Math.abs(totalHSD) * toNumber(hsdRate)
  const msFinalAmount = Math.abs(totalMS) * toNumber(msRate)
  const totalCollection = hsdFinalAmount + msFinalAmount
  const totalPayments = toNumber(phonePay) + toNumber(cardPay)
  const finalBalance = totalCollection - totalPayments
  const ttAmount = toNumber(ttPrice) * toNumber(ttSold)

  const value500 = 500 * toNumber(note500)
  const value200 = 200 * toNumber(note200)
  const value100 = 100 * toNumber(note100)
  const value50 = 50 * toNumber(note50)
  const value20 = 20 * toNumber(note20)
  const value10 = 10 * toNumber(note10)
  const valueCoins = toNumber(coins)
  const totalCash =
    value500 + value200 + value100 + value50 + value20 + value10 + valueCoins

  const finalTotal = finalBalance - totalCash

  const downloadReportPDF = () => {
    const date = todayISO()
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Daily Report - ${date}`, 14, 16)

    let y = 24
    const section = (title, rows) => {
      if (y > 260) {
        doc.addPage()
        y = 20
      }
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.text(title, 14, y)
      doc.setFont(undefined, 'normal')
      autoTable(doc, {
        startY: y + 2,
        body: rows,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 60 } },
        margin: { left: 14 },
      })
      y = doc.lastAutoTable.finalY + 8
    }

    section('HSD', [
      [
        'Nozzle 1: X - Y',
        `${fmt(toNumber(hsdNozzle1Closing))} - ${fmt(toNumber(hsdNozzle1Opening))} = ${fmt(hsdAmount1)}`,
      ],
      [
        'Nozzle 2: X - Y',
        `${fmt(toNumber(hsdNozzle2Closing))} - ${fmt(toNumber(hsdNozzle2Opening))} = ${fmt(hsdAmount2)}`,
      ],
      ['HSD Total', fmt(totalHSD)],
    ])

    section('MS', [
      [
        'Nozzle 1: X - Y',
        `${fmt(toNumber(msNozzle1Closing))} - ${fmt(toNumber(msNozzle1Opening))} = ${fmt(msAmount1)}`,
      ],
      [
        'Nozzle 2: X - Y',
        `${fmt(toNumber(msNozzle2Closing))} - ${fmt(toNumber(msNozzle2Opening))} = ${fmt(msAmount2)}`,
      ],
      ['MS Total', fmt(totalMS)],
    ])

    section('Final Collection', [
      ['HSD Rate', fmt(toNumber(hsdRate))],
      ['HSD Amount', fmt(hsdFinalAmount)],
      ['MS Rate', fmt(toNumber(msRate))],
      ['MS Amount', fmt(msFinalAmount)],
      ['Final HSD+MS', fmt(totalCollection)],
    ])

    section('2TT', [
      ['2TT Price', fmt(toNumber(ttPrice))],
      ['2TT Sold', fmt(toNumber(ttSold))],
      ['2TT Amount', fmt(ttAmount)],
    ])

    section('Payment', [
      ['Phone Pay', fmt(toNumber(phonePay))],
      ['Card Pay', fmt(toNumber(cardPay))],
      ['Total Payments', fmt(totalPayments)],
      ['Final Balance', fmt(finalBalance)],
    ])

    section('Denomination', [
      [`500 x ${fmt(toNumber(note500))}`, fmt(value500)],
      [`200 x ${fmt(toNumber(note200))}`, fmt(value200)],
      [`100 x ${fmt(toNumber(note100))}`, fmt(value100)],
      [`50 x ${fmt(toNumber(note50))}`, fmt(value50)],
      [`20 x ${fmt(toNumber(note20))}`, fmt(value20)],
      [`10 x ${fmt(toNumber(note10))}`, fmt(value10)],
      ['Coins', fmt(valueCoins)],
      ['Total Cash', fmt(totalCash)],
    ])

    section('Final Result', [['Final', fmt(finalTotal)]])

    if (comment.trim()) {
      if (y > 260) {
        doc.addPage()
        y = 20
      }
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.text('Comment', 14, y)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
      const lines = doc.splitTextToSize(comment, 180)
      doc.text(lines, 14, y + 6)
    }

    doc.save(`daily-report-${date}.pdf`)
  }

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
      comment,
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
      downloadReportPDF()
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
        <p className="total">Final balance: {fmt(finalBalance)}</p>
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

      <section className="section">
        <h2>Final</h2>
        <p className={`total ${finalTotal < 0 ? 'negative' : 'positive'}`}>
          Final: {fmt(finalTotal)}
        </p>
        <label className="comment-label">
          Comment
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a note for today's report"
            rows={3}
          />
        </label>
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
