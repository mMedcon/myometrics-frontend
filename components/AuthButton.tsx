'use client';

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Загрузка...</p>;

  if (session) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm">{session.user?.name || session.user?.email}</span>
        <button className="btn btn-outline" onClick={() => signOut()}>
          Выйти
        </button>
      </div>
    );
  }

  return (
    <button className="btn btn-primary" onClick={() => signIn('auth0')}>
      Войти через Auth0
    </button>
  );
}
