/**
 * @file EditProfilePage.tsx
 * @description Full-page profile editor for the currently logged-in user.
 */

import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Camera, Loader2, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { useAuthStore } from '../../store/authStore'
import {
  getProfile,
  updateProfile,
  type Profile,
} from '../../services/profileservices/profile.service'

const DEFAULT_AVATAR =
  'https://pub-cdn.sider.ai/u/U0VEH8VKN6G/web-coder/6a61c625388e2f3cd0e01060/resource/b02b3ed2-19f2-4acf-94db-7870bd977184.jpg'

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

/**
 * @component EditProfilePage
 * @description Dedicated screen for editing the current user's profile.
 */
const EditProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [mobileNo, setMobileNo] = useState('')
  const [profilePicture, setProfilePicture] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSuper = user?.isSuperAdmin

  useEffect(() => {
    if (!user) {
      navigate('/dashboard')
      return
    }

    getProfile(user.id, user.isSuperAdmin ? 'super' : 'org')
      .then((profile) => {
        setFullName(profile.full_name ?? '')
        setEmail(profile.email ?? '')
        setMobileNo(profile.mobile_no ?? '')
        setProfilePicture(profile.profile_picture ?? '')
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Please select a JPG or PNG image')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB')
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setProfilePicture(dataUrl)
    } catch {
      toast.error('Failed to read the selected image')
    }
  }

  const handleRemovePicture = () => {
    setProfilePicture('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      const updated = await updateProfile(user.id, isSuper ? 'super' : 'org', {
        full_name: fullName,
        email: isSuper ? null : email,
        mobile_no: isSuper ? null : mobileNo,
        profile_picture: profilePicture || null,
      })

      updateUser({ fullName: updated.full_name })
      toast.success('Profile updated successfully')
      navigate('/dashboard')
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Edit Profile"
        breadcrumb={['Profile', 'Edit Profile']}
        extra={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white py-16 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-[#2E7D32]" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          {/* Header banner */}
          <div className="flex h-24 items-end bg-gradient-to-br from-emerald-500 via-emerald-600 to-lime-500 px-6 pb-4">
            <h2 className="text-lg font-semibold text-white">Your Profile</h2>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-8">
            {/* Avatar */}
            <div className="-mt-12 mb-6 flex flex-col items-center">
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-emerald-50 shadow-lg">
                  <img
                    src={profilePicture || DEFAULT_AVATAR}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
                  title="Upload profile picture"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handlePictureChange}
              />

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-[#2E7D32] hover:underline"
                >
                  Upload picture
                </button>

                {profilePicture ? (
                  <button
                    type="button"
                    onClick={handleRemovePicture}
                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                ) : null}
              </div>

              <p className="mt-1 text-[10px] text-slate-400">
                JPG or PNG, max 2MB
              </p>
            </div>

            {/* Fields */}
            <div className="mx-auto grid max-w-xl gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Username
                </label>
                <input
                  readOnly
                  value={user?.username ?? ''}
                  className="w-full rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                />
              </div>

              {!isSuper ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Mobile No
                    </label>
                    <input
                      value={mobileNo}
                      onChange={(e) => setMobileNo(e.target.value)}
                      className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                    />
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer actions */}
            <div className="mx-auto mt-6 flex max-w-xl justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default EditProfilePage
