'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useTheme } from '@/lib/context/ThemeContext';
import {IconKeys} from "next/dist/lib/metadata/constants";

interface NavigationProps {
  children: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/upload', label: 'Upload Image' },
    { href: '/history', label: 'Upload History' },
    ...(user?.role === 'admin' ? [{ href: '/analytics', label: 'Analytics' }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="shadow-sm border-b" style={{ backgroundColor: 'var(--card-background)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                  MyoMetrics
                </span>
                {isDevMode && (
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 font-medium">
                    DEV MODE
                  </span>
                )}
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-white'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: pathname === item.href ? 'var(--primary)' : 'transparent',
                    color: pathname === item.href ? 'white' : 'var(--text)',
                  }}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2" style={{ color: 'var(--text)' }}>
                <span className="text-sm">Welcome, {user?.firstName}</span>
              </div>
              
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md transition-colors"
                style={{ color: 'var(--text)' }}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-background)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {theme === 'light' ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                )}
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{ color: 'var(--text)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-background)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                    <span className="text-white text-sm font-medium">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <span className="hidden md:block">▼</span>
                </button>

                {/* Dropdown Menu */}
                {isMobileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 card">
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm transition-colors"
                      style={{ color: 'var(--text)' }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-background)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Account Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm transition-colors"
                      style={{ color: 'var(--text)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-background)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t" style={{ borderColor: 'var(--border)' }}>
          <nav className="px-4 pb-3 pt-2 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-white'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: pathname === item.href ? 'var(--primary)' : 'transparent',
                  color: pathname === item.href ? 'white' : 'var(--text)',
                }}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl flex space-x-4 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
        <div className="bg-amber-50 w-1/4 h-150 fixed right-10 top-50 chat-container flex-col rounded-lg">
            <h1 className="bg-gray-500 rounded-t-lg p-3 text-xl">Ask AI</h1>
            <div className="h-5/6"></div>
            <div className="bg-gray-500 rounded-b-lg p-3 text-xl flex-row">
              <input placeholder="Ask.." className="mr-20"/>
              <button>A</button>
            </div>
          {/*<button className="btn-primary">*/}
          {/*  0*/}
          {/*</button>*/}
        </div>
      </main>
    </div>
  );
}
