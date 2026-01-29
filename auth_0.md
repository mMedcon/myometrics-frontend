# Next.js + NextAuth.js конфигурация для Auth0

## 1. Установка зависимостей

```bash
npm install next-auth @auth0/nextjs-auth0
```

## 2. Переменные окружения (.env.local)

### Для https://myometrics.vercel.app/
```env
# NextAuth
NEXTAUTH_URL=https://myometrics.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key

# Auth0
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=https://myometrics.vercel.app
AUTH0_ISSUER_BASE_URL=https://YOUR_TENANT.auth0.com
AUTH0_CLIENT_ID=your-myometrics-client-id
AUTH0_CLIENT_SECRET=your-myometrics-client-secret

# Django API
NEXT_PUBLIC_API_URL=https://myometrics-backend.onrender.com
```

### Для https://mmedcon-finance.vercel.app/
```env
# NextAuth
NEXTAUTH_URL=https://mmedcon-finance.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key

# Auth0
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=https://mmedcon-finance.vercel.app
AUTH0_ISSUER_BASE_URL=https://YOUR_TENANT.auth0.com
AUTH0_CLIENT_ID=your-finance-client-id
AUTH0_CLIENT_SECRET=your-finance-client-secret

# Django API
NEXT_PUBLIC_API_URL=https://myometrics-backend.onrender.com
```

## 3. NextAuth конфигурация

### pages/api/auth/[...nextauth].js
```javascript
import NextAuth from "next-auth"
import Auth0Provider from "next-auth/providers/auth0"

export default NextAuth({
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      issuer: process.env.AUTH0_ISSUER_BASE_URL,
      authorization: {
        params: {
          scope: "openid email profile offline_access",
          audience: process.env.AUTH0_API_AUDIENCE || process.env.AUTH0_CLIENT_ID
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, user, profile }) {
      // Save Auth0 tokens to JWT token
      if (account) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
        token.refreshToken = account.refresh_token
        token.sub = account.providerAccountId
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken
      session.idToken = token.idToken
      session.user.sub = token.sub
      return session
    }
  },
  events: {
    async signIn({ user, account, profile }) {
      // Optional: sync user data after login
      if (account.provider === 'auth0') {
        console.log('User signed in:', user.email)
      }
    }
  }
})
```

## 4. API утилиты для работы с Django

### lib/api.js
```javascript
import { getSession } from "next-auth/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export async function apiRequest(endpoint, options = {}) {
  const session = await getSession()
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken && {
        'Authorization': `Bearer ${session.accessToken}`
      }),
      ...options.headers
    },
    ...options
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  
  return response.json()
}

// Sync user data to Auth0 metadata
export async function syncUserData(data, appName = 'myometrics') {
  return apiRequest('/api/auth0/sync/', {
    method: 'POST',
    body: JSON.stringify({
      data,
      app_name: appName
    })
  })
}

// Get user profile with Auth0 metadata
export async function getUserProfile() {
  return apiRequest('/api/auth0/profile/')
}

// Get shared data from other apps
export async function getSharedData() {
  return apiRequest('/api/auth0/shared/')
}

// Send data to another app's API
export async function sendDataToApp(targetAppUrl, data) {
  const session = await getSession()
  
  return fetch(`${targetAppUrl}/api/auth0/receive/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`
    },
    body: JSON.stringify({
      source_app: 'myometrics', // or 'mmedcon-finance'
      user_data: data
    })
  })
}
```

## 5. Компонент для синхронизации данных

### components/DataSync.jsx
```javascript
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { syncUserData, getSharedData } from '../lib/api'

export default function DataSync() {
  const { data: session } = useSession()
  const [sharedData, setSharedData] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSyncData = async () => {
    if (!session) return
    
    setLoading(true)
    try {
      // Example: sync current app data
      const dataToSync = {
        preferences: { theme: 'dark', language: 'ru' },
        profile: { completed: true },
        lastActivity: new Date().toISOString()
      }
      
      await syncUserData(dataToSync, 'myometrics')
      alert('Данные синхронизированы!')
    } catch (error) {
      console.error('Sync failed:', error)
      alert('Ошибка синхронизации')
    } finally {
      setLoading(false)
    }
  }

  const handleGetSharedData = async () => {
    if (!session) return
    
    setLoading(true)
    try {
      const data = await getSharedData()
      setSharedData(data)
    } catch (error) {
      console.error('Failed to get shared data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return <p>Требуется авторизация</p>
  }

  return (
    <div>
      <h3>Синхронизация данных между приложениями</h3>
      
      <button 
        onClick={handleSyncData}
        disabled={loading}
      >
        {loading ? 'Синхронизируем...' : 'Синхронизировать данные'}
      </button>
      
      <button 
        onClick={handleGetSharedData}
        disabled={loading}
      >
        Получить данные из других приложений
      </button>
      
      {sharedData && (
        <div>
          <h4>Данные из других приложений:</h4>
          <pre>{JSON.stringify(sharedData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
```

## 6. Компонент логина/логаута

### components/AuthButton.jsx
```javascript
import { useSession, signIn, signOut } from "next-auth/react"

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") return <p>Загрузка...</p>

  if (session) {
    return (
      <div>
        <p>Добро пожаловать, {session.user.email}!</p>
        <button onClick={() => signOut()}>
          Выйти
        </button>
      </div>
    )
  }
  
  return (
    <button onClick={() => signIn('auth0')}>
      Войти через Auth0
    </button>
  )
}
```

## 7. Wrapper для SessionProvider

### pages/_app.js
```javascript
import { SessionProvider } from "next-auth/react"

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  )
}
```

## 8. Пример использования на странице

### pages/index.js
```javascript
import { useSession } from "next-auth/react"
import AuthButton from "../components/AuthButton"
import DataSync from "../components/DataSync"

export default function Home() {
  const { data: session } = useSession()

  return (
    <div>
      <h1>MyoMetrics App</h1>
      <AuthButton />
      
      {session && (
        <div>
          <h2>Пользователь авторизован</h2>
          <p>Email: {session.user.email}</p>
          <p>Auth0 ID: {session.user.sub}</p>
          
          <DataSync />
        </div>
      )}
    </div>
  )
}
```