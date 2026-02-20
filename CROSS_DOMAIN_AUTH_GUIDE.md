# Cross-Domain SSO Setup Guide

## Проблема
NextAuth сессии работают только в пределах одного домена. Для общей авторизации между двумя сайтами нужны дополнительные настройки.

## Решения

### Вариант 1: Shared Database для сессий
```javascript
// pages/api/auth/[...nextauth].ts
export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // Используем одну и ту же базу данных для обоих сайтов
  adapter: PrismaAdapter(prisma), // или другой адаптер
  session: {
    strategy: "database", // Важно: database вместо jwt
  },
  callbacks: {
    async session({ session, user }) {
      // Добавляем информацию о пользователе из БД
      session.user.id = user.id;
      return session;
    },
  },
})
```

### Вариант 2: Custom JWT с общим секретом
```javascript
// Один и тот же NEXTAUTH_SECRET на обоих сайтах
export default NextAuth({
  providers: [GoogleProvider(...)],
  jwt: {
    secret: process.env.NEXTAUTH_SECRET, // Одинаковый на обоих сайтах
    signingKey: process.env.JWT_SIGNING_PRIVATE_KEY,
    verificationOptions: {
      algorithms: ['HS256'],
    },
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider;
        // Добавляем custom поля для синхронизации
        token.sites = ['site1.vercel.app', 'site2.vercel.app'];
      }
      return token;
    },
  },
})
```

### Вариант 3: Cross-Domain Cookie (сложнее)
Настроить cookies с domain=".yourdomain.com" но требует общий родительский домен.

## Рекомендуемое решение для Vercel

### Простое решение: Google One-Tap
Пользователь авторизуется быстро на каждом сайте через Google One-Tap:

```javascript
// components/GoogleOneTap.tsx
export default function GoogleOneTap() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.google?.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true, // Автоматически выбирает аккаунт если уже авторизован
        cancel_on_tap_outside: false,
      });
      
      window.google?.accounts.id.prompt(); // Показывает One-Tap если не авторизован
    }
  }, []);
  
  return null;
}
```

### Продвинутое решение: Shared User Database

1. **Общая база данных пользователей** (PostgreSQL на Aiven)
2. **API для проверки пользователя** между сайтами
3. **Автоматический вход** если пользователь найден в БД

```javascript
// lib/api/cross-site-auth.ts
export async function checkUserAcrossSites(email: string) {
  const response = await fetch(`${SHARED_API_URL}/users/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  
  return response.json(); // { exists: true, user: {...} }
}

// Использование в callback
async jwt({ token, account }) {
  if (account?.provider === 'google') {
    // Проверяем/создаем пользователя в общей БД
    const sharedUser = await checkUserAcrossSites(token.email);
    token.sharedUserId = sharedUser.id;
  }
  return token;
}
```

## Что нужно добавить в environment variables

```env
# Общие для обоих сайтов
NEXTAUTH_SECRET=одинаковый_секрет_для_обоих_сайтов
GOOGLE_CLIENT_ID=одинаковый_для_обоих
GOOGLE_CLIENT_SECRET=одинаковый_для_обоих

# Уникальные для каждого сайта  
NEXTAUTH_URL=https://site1.vercel.app (или site2.vercel.app)

# Для shared database (опционально)
SHARED_DATABASE_URL=postgres://...
SHARED_API_URL=https://shared-api.vercel.app
```

## Быстрое решение (рекомендую начать с этого)

1. **Используйте одинаковые Google credentials** на обоих сайтах ✅
2. **Одинаковый NEXTAUTH_SECRET** на обоих сайтах
3. **Google One-Tap** для быстрой авторизации
4. **Общая база пользователей** для хранения профилей

Пользователь будет авторизовываться на каждом сайте, но это будет происходить автоматически/быстро через Google.