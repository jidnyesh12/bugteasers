'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export default function TestDbPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState<Record<string, unknown> | Error | null>(null)
  
  useEffect(() => {
    async function checkConnection() {
      try {
        // Use standard createClient with public anon key for client-side check
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        )
        
        // 1. Check if we can talk to Supabase
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
        
        if (error) {
          // If the table doesn't exist, we might get a 404 or specific error, 
          // but receiving ANY error from Supabase means we ARE connected.
          throw error
        }
        
        setStatus('success')
        setMessage('Connected to Supabase successfully!')
        setDetails({
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured ✅' : 'Missing ❌',
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured ✅' : 'Missing ❌',
          profilesTableReachable: true
        })
        
      } catch (err: unknown) {
        setStatus('error')
        // Differentiate between "Network Error" (not connected) and "Database Error" (connected but failing)
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'Failed to fetch') {
           setMessage('Network Error: Could not reach Supabase. Check your internet or URL.')
        } else {
           setMessage(`Connected to Supabase, but received error: ${message}`)
           if (err instanceof Error) {
             setDetails({ message: err.message, name: err.name })
           } else if (typeof err === 'object' && err !== null) {
             setDetails(err as Record<string, unknown>)
           } else {
             setDetails({ error: String(err) })
           }
        }
      }
    }
    
    checkConnection()
  }, [])

  return (
    <div className="p-10 font-sans max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
      
      <div className={`p-6 rounded-lg border ${
        status === 'loading' ? 'bg-blue-50 border-blue-200' :
        status === 'success' ? 'bg-green-50 border-green-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-3 h-3 rounded-full ${
            status === 'loading' ? 'bg-blue-500 animate-pulse' :
            status === 'success' ? 'bg-green-500' :
            'bg-red-500'
          }`} />
          <h2 className={`font-semibold text-lg ${
            status === 'loading' ? 'text-blue-700' :
            status === 'success' ? 'text-green-700' :
            'text-red-700'
          }`}>
            {status === 'loading' ? 'Testing Connection...' :
             status === 'success' ? 'Connection Successful' :
             'Connection Failed'}
          </h2>
        </div>
        
        <p className={`text-sm ${
           status === 'loading' ? 'text-blue-600' :
           status === 'success' ? 'text-green-600' :
           'text-red-600'
        }`}>
          {message}
        </p>

        {details && (
          <div className="mt-4 pt-4 border-t border-black/10">
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-2">Debug Details</h3>
            <pre className="text-xs p-3 bg-white/50 rounded overflow-auto font-mono">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="mt-8 pt-8 border-t text-sm text-gray-500">
        <p>This page tests if the application can reach your Supabase project.</p>
        <p className="mt-2">Make sure your <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> file has:</p>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        </ul>
      </div>
    </div>
  )
}
