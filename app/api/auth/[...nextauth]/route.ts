import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase/client'

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required')
                }

                // Look up user from the public.users table
                const { data: user, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', credentials.email.toLowerCase().trim())
                    .single()

                if (error || !user) {
                    throw new Error('Invalid email or password')
                }

                // Verify password
                const isValidPassword = await bcrypt.compare(
                    credentials.password,
                    user.password_hash
                )

                if (!isValidPassword) {
                    throw new Error('Invalid email or password')
                }

                // Return user object that NextAuth will encode into the JWT
                return {
                    id: user.id,
                    email: user.email,
                    name: user.full_name,
                    role: user.role,
                }
            },
        }),
    ],

    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    pages: {
        signIn: '/login',
        error: '/login',
    },

    callbacks: {
        async jwt({ token, user }) {
            // On initial sign-in, persist user fields to the JWT
            if (user) {
                token.id = user.id
                token.role = user.role ?? 'student'
                token.name = user.name
            }
            return token
        },
        async session({ session, token }) {
            // Expose user fields to the client session
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.name = token.name as string
            }
            return session
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
