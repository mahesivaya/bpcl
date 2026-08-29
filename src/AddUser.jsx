import { useState } from 'react'
import { client } from './amplifyClient.js'

function AddUser() {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleCreate = async () => {
    setStatus('saving')
    try {
      const { errors } = await client.mutations.createUser({ username, password })
      if (errors) {
        setStatus('error')
        setErrorMessage(errors[0]?.message || 'Could not create account. Please try again.')
        return
      }
      setStatus('done')
      setUsername('')
      setPassword('')
    } catch (e) {
      setStatus('error')
      setErrorMessage(e?.message || 'Could not create account. Please try again.')
    }
  }

  return (
    <div className="adduser-wrap">
      <button
        type="button"
        className="adduser-btn"
        onClick={() => {
          setOpen((o) => !o)
          setStatus('idle')
        }}
      >
        Add User
      </button>

      {open && (
        <div className="adduser-panel">
          <label>
            Username / Email
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="someone@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </label>
          <button
            type="button"
            className="save-btn"
            onClick={handleCreate}
            disabled={status === 'saving' || !username || !password}
          >
            {status === 'saving' ? 'Creating...' : 'Create Account'}
          </button>
          {status === 'done' && <p className="save-status success">Account created.</p>}
          {status === 'error' && <p className="save-status error">{errorMessage}</p>}
        </div>
      )}
    </div>
  )
}

export default AddUser
