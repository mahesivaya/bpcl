import { useState } from 'react'

function App() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (a === '' || b === '') {
      setResult(null)
      setError('Please enter both numbers.')
      return
    }

    const numA = Number(a)
    const numB = Number(b)

    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      setResult(null)
      setError('Please enter valid numbers.')
      return
    }

    setError('')
    setResult(numA + numB)
  }

  const handleReset = () => {
    setA('')
    setB('')
    setResult(null)
    setError('')
  }

  return (
    <div className="container">
      <h1>Addition Calculator</h1>
      <p className="subtitle">Enter two numbers and add them together.</p>

      <form onSubmit={handleSubmit}>
        <label>
          First number
          <input
            type="number"
            step="any"
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="0"
          />
        </label>

        <span className="plus" aria-hidden="true">
          +
        </span>

        <label>
          Second number
          <input
            type="number"
            step="any"
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="0"
          />
        </label>

        <div className="actions">
          <button type="submit">Add</button>
          <button type="button" className="secondary" onClick={handleReset}>
            Clear
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {result !== null && (
        <p className="result">
          {a} + {b} = {result}
        </p>
      )}
    </div>
  )
}

export default App
