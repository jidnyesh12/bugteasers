import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase/client'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password, fullName, role } = body

        // ── Validation ──
        if (!email || !password || !fullName || !role) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            )
        }

        if (!['student', 'instructor'].includes(role)) {
            return NextResponse.json(
                { error: 'Role must be student or instructor' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        const normalizedEmail = email.toLowerCase().trim()

        // ── Check if user already exists ──
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', normalizedEmail)
            .single()

        if (existing) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 409 }
            )
        }

        // ── Hash password ──
        const password_hash = await bcrypt.hash(password, 12)

        // ── Insert into users table ──
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                email: normalizedEmail,
                full_name: fullName.trim(),
                role,
                password_hash,
            })
            .select()
            .single()

        if (insertError) {
            console.error('Register insert error:', insertError)
            return NextResponse.json(
                { error: 'Failed to create account. Please try again.' },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                message: 'Account created successfully',
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    full_name: newUser.full_name,
                    role: newUser.role,
                },
            },
            { status: 201 }
        )
    } catch (err) {
        console.error('Register error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
