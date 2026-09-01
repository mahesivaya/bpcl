import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const trunc2 = (num) => {
  const sign = num < 0 ? -1 : 1
  return (sign * Math.trunc(Math.abs(num) * 100 + 1e-9)) / 100
}

const fmt = (num) => {
  if (num === 0) return '0'
  return trunc2(num).toFixed(2)
}

const n = (value) => (typeof value === 'number' && !Number.isNaN(value) ? value : 0)

export const buildDailyReportPDF = (record) => {
  const hsdAmount1 = n(record.hsdNozzle1Closing) - n(record.hsdNozzle1Opening)
  const hsdAmount2 = n(record.hsdNozzle2Closing) - n(record.hsdNozzle2Opening)
  const totalHSD = hsdAmount1 + hsdAmount2
  const msAmount1 = n(record.msNozzle1Closing) - n(record.msNozzle1Opening)
  const msAmount2 = n(record.msNozzle2Closing) - n(record.msNozzle2Opening)
  const totalMS = msAmount1 + msAmount2
  const hsdFinalAmount = Math.abs(totalHSD) * n(record.hsdRate)
  const msFinalAmount = Math.abs(totalMS) * n(record.msRate)
  const totalCollection = hsdFinalAmount + msFinalAmount
  const totalPayments =
    n(record.phonePay) +
    n(record.afterPhonePay) +
    n(record.cardPay) +
    n(record.maintenance) +
    n(record.other)
  const ttAmount = n(record.ttPrice) * n(record.ttSold)
  const finalBalance = totalCollection + ttAmount - totalPayments

  const value500 = 500 * n(record.note500)
  const value200 = 200 * n(record.note200)
  const value100 = 100 * n(record.note100)
  const value50 = 50 * n(record.note50)
  const value20 = 20 * n(record.note20)
  const value10 = 10 * n(record.note10)
  const valueCoins = n(record.coins)
  const totalCash =
    value500 + value200 + value100 + value50 + value20 + value10 + valueCoins

  const finalTotal = finalBalance - totalCash

  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(`Daily Report - ${record.date}`, 14, 16)

  let y = 22
  const section = (title, rows) => {
    doc.setFontSize(9.5)
    doc.setFont(undefined, 'bold')
    doc.text(title, 14, y)
    doc.setFont(undefined, 'normal')
    autoTable(doc, {
      startY: y + 1,
      body: rows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.2 },
      columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 60 } },
      margin: { left: 14 },
    })
    y = doc.lastAutoTable.finalY + 4
  }

  section('Diesel Meter', [
    [
      'Nozzle 1: Start - End',
      `${fmt(n(record.hsdNozzle1Closing))} - ${fmt(n(record.hsdNozzle1Opening))} = ${fmt(hsdAmount1)}`,
    ],
    [
      'Nozzle 2: Start - End',
      `${fmt(n(record.hsdNozzle2Closing))} - ${fmt(n(record.hsdNozzle2Opening))} = ${fmt(hsdAmount2)}`,
    ],
    ['Total Diesel', fmt(totalHSD)],
  ])

  section('Petrol Meter', [
    [
      'Nozzle 1: Start - End',
      `${fmt(n(record.msNozzle1Closing))} - ${fmt(n(record.msNozzle1Opening))} = ${fmt(msAmount1)}`,
    ],
    [
      'Nozzle 2: Start - End',
      `${fmt(n(record.msNozzle2Closing))} - ${fmt(n(record.msNozzle2Opening))} = ${fmt(msAmount2)}`,
    ],
    ['Total Petrol', fmt(totalMS)],
  ])

  section('Final Collection', [
    ['Diesel Price', fmt(n(record.hsdRate))],
    ['Diesel Amount', fmt(hsdFinalAmount)],
    ['Petrol Price', fmt(n(record.msRate))],
    ['Petrol Amount', fmt(msFinalAmount)],
    ['Diesel+Petrol Amount', fmt(totalCollection)],
  ])

  section('2TT', [
    ['2TT Price', fmt(n(record.ttPrice))],
    ['2TT Sold', fmt(n(record.ttSold))],
    ['2TT Amount', fmt(ttAmount)],
    ['Final Balance', fmt(finalBalance)],
  ])

  section('Payment', [
    ['Phone Pay', fmt(n(record.phonePay))],
    ['After Phone Pay', fmt(n(record.afterPhonePay))],
    ['Card Pay', fmt(n(record.cardPay))],
    ['Maintenance', fmt(n(record.maintenance))],
    ['Other', fmt(n(record.other))],
    ['Online Payments', fmt(totalPayments)],
  ])

  section('Denomination', [
    [`500 x ${fmt(n(record.note500))}`, fmt(value500)],
    [`200 x ${fmt(n(record.note200))}`, fmt(value200)],
    [`100 x ${fmt(n(record.note100))}`, fmt(value100)],
    [`50 x ${fmt(n(record.note50))}`, fmt(value50)],
    [`20 x ${fmt(n(record.note20))}`, fmt(value20)],
    [`10 x ${fmt(n(record.note10))}`, fmt(value10)],
    ['Coins', fmt(valueCoins)],
    ['Total Cash', fmt(totalCash)],
  ])

  section('Final Result', [['Final', fmt(finalTotal)]])

  const comment = (record.comment || '').trim()
  if (comment) {
    doc.setFontSize(9.5)
    doc.setFont(undefined, 'bold')
    doc.text('Comment', 14, y)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    const lines = doc.splitTextToSize(comment, 180)
    doc.text(lines, 14, y + 5)
  }

  doc.save(`daily-report-${record.date}.pdf`)
}
