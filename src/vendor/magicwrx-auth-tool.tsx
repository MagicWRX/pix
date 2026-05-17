'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import React, { createContext, useContext, useEffect, useState, type ReactNode, type ButtonHTMLAttributes } from 'react'

export interface User {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  session: unknown | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null
function getSupabase() {
  if (!supabaseInstance) {
    if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

export function createClient() {
  return getSupabase()
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<unknown | null>(null)

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password })
    return { error: error?.message }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signUp({ email, password })
    return { error: error?.message }
  }

  const signOut = async () => {
    await getSupabase().auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, session }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export function AuthCallback({ onSuccess }: { onSuccess?: () => void }) {
  return null
}

export function LoginButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return null
}

export function LogoutButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return null
}
