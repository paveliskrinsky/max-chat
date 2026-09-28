import { useState } from 'react'
import type { Credentials } from './api/types'
import { LoginScreen } from './components/LoginScreen'
import { Messenger } from './components/Messenger'
import { clearCredentials, loadCredentials, saveCredentials } from './lib/storage'

export default function App() {
  const [creds, setCreds] = useState<Credentials | null>(loadCredentials)

  if (!creds) {
    return (
      <LoginScreen
        onLogin={(next) => {
          saveCredentials(next)
          setCreds(next)
        }}
      />
    )
  }

  return (
    <Messenger
      key={creds.idInstance}
      creds={creds}
      onLogout={() => {
        clearCredentials()
        setCreds(null)
      }}
    />
  )
}
