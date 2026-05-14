'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhotoUpload } from '@/components/jobs/photo-upload'
import { createClient } from '@/lib/supabase/client'
import { PHOTO_TYPES } from '@/lib/constants'

export default function JobPhotosPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  const [photos, setPhotos] = useState<any[]>([])
  const [jobNumber, setJobNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: job }, { data: photos }] = await Promise.all([
        supabase.from('jobs').select('job_number').eq('id', jobId).single(),
        supabase.from('job_photos').select('*').eq('job_id', jobId).order('created_at'),
      ])
      setJobNumber(job?.job_number ?? '')
      setPhotos(photos ?? [])
      setLoading(false)
    }
    load()
  }, [jobId])

  function handleUploaded(photo: any) {
    setPhotos((prev) => [...prev, photo])
  }

  async function deletePhoto(photo: any) {
    await supabase.storage.from('job-photos').remove([photo.storage_path])
    await supabase.from('job_photos').delete().eq('id', photo.id)
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  const byType = PHOTO_TYPES.map((t) => ({
    ...t,
    photos: photos.filter((p) => p.photo_type === t.value),
  })).filter((t) => t.photos.length > 0)

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/jobs/${jobId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" />
          {jobNumber}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Photos</h1>
        <span className="text-sm text-gray-500">{photos.length} total</span>
      </div>

      <div className="bg-white rounded-lg border p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Upload Photos</h2>
        <PhotoUpload jobId={jobId} onUploaded={handleUploaded} />
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No photos yet. Use the upload section above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {byType.map((group) => (
            <div key={group.value} className="bg-white rounded-lg border p-5">
              <h3 className="font-semibold text-gray-900 mb-3">{group.label} ({group.photos.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {group.photos.map((photo: any) => (
                  <div key={photo.id} className="relative group">
                    <a href={photo.url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={photo.url}
                        alt={group.label}
                        className="w-full h-32 object-cover rounded border hover:opacity-90"
                      />
                    </a>
                    <button
                      onClick={() => deletePhoto(photo)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
