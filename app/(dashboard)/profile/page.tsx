'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const { profile, user, refreshProfile, updatePassword } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [institution, setInstitution] = useState(profile?.institution || '')
  const [githubUrl, setGithubUrl] = useState(profile?.github_url || '')
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url || '')
  const [saving, setSaving] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        bio,
        institution,
        github_url: githubUrl,
        website_url: websiteUrl,
      })
      .eq('id', user?.id)

    setSaving(false)

    if (error) {
      toast(error.message, 'error')
      return
    }

    toast('Profile updated successfully', 'success')
    refreshProfile()
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      toast('Passwords do not match', 'error')
      return
    }
    if (newPassword.length < 6) {
      toast('Password must be at least 6 characters', 'error')
      return
    }

    setChangingPassword(true)
    const { error } = await updatePassword(newPassword)
    setChangingPassword(false)

    if (error) {
      toast(error, 'error')
      return
    }

    toast('Password changed successfully', 'success')
    setNewPassword('')
    setConfirmNewPassword('')
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast('Avatar must be less than 2MB', 'error')
      return
    }

    setUploadingAvatar(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `${user?.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      toast(uploadError.message, 'error')
      setUploadingAvatar(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user?.id)

    setUploadingAvatar(false)

    if (updateError) {
      toast(updateError.message, 'error')
      return
    }

    toast('Avatar uploaded successfully', 'success')
    refreshProfile()
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Profile Settings</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage your personal information and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Avatar & Basic Info */}
        <div className="card p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-[var(--accent-primary)] flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-lg">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    (profile?.full_name?.[0] || 'U').toUpperCase()
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-lg bg-white border border-[var(--border-primary)] shadow-sm flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{profile?.full_name || 'User'}</h3>
              <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-medium rounded-md capitalize">
                  {profile?.role || 'student'}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <form onSubmit={handleUpdateProfile} className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5">Personal Information</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" />
            <Input label="Institution" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="School or university" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio about yourself"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-colors text-sm resize-none"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Input label="GitHub URL" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username" />
            <Input label="Website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
          </div>
          <Button type="submit" loading={saving}>Save Changes</Button>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5">Change Password</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              showPasswordToggle
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Confirm new password"
              showPasswordToggle
            />
          </div>
          <Button type="submit" loading={changingPassword} variant="secondary">Update Password</Button>
        </form>
      </div>
    </div>
  )
}
