'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { PHOTO_TYPES } from '@/lib/constants'

interface PhotoUploadProps {
  jobId: string
  onUploaded: (photo: { url: string; photo_type: string; id: string }) => void
}

export function PhotoUpload({ jobId, onUploaded }: PhotoUploadProps) {
  const [photoType, setPhotoType] = useState('before')
  const [uploading, setUploading] = useState(false)
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const newPreviews = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  function removePreview(index: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function upload() {
    if (previews.length === 0) return
    setUploading(true)
    const supabase = createClient()

    for (const { file } of previews) {
      const ext = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path = `${jobId}/${photoType}/${filename}`

      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(path, file, { upsert: false })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from('job-photos').getPublicUrl(path)

      const { data: photo } = await supabase
        .from('job_photos')
        .insert({
          job_id: jobId,
          photo_type: photoType,
          url: publicUrl,
          storage_path: path,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select('id, url, photo_type')
        .single()

      if (photo) {
        onUploaded(photo as any)
      }
    }

    setPreviews([])
    setUploading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={photoType} onValueChange={setPhotoType}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PHOTO_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="w-4 h-4 mr-2" />
          Select Photos
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative">
                <img src={p.preview} alt="" className="w-full h-24 object-cover rounded border" />
                <button
                  type="button"
                  onClick={() => removePreview(i)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <Button onClick={upload} disabled={uploading} className="w-full sm:w-auto">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : `Upload ${previews.length} Photo${previews.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  )
}
