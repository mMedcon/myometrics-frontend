'use client';

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Загрузка...</p>;

  if (session) {
    // User is logged in but we don't show anything here
    // Logout functionality is handled in Navigation dropdown
    return null;
  }

  return (
    <button
      className="btn btn-primary"
      onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
    >
      Войти
    </button>
  );
}
