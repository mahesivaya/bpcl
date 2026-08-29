import React from 'react'
import ReactDOM from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import App from './App.jsx'
import outputs from '../amplify_outputs.json'
import './index.css'

Amplify.configure(outputs)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Authenticator hideSignUp>
      {({ signOut, user }) => <App signOut={signOut} user={user} />}
    </Authenticator>
  </React.StrictMode>,
)
