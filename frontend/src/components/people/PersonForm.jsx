import { useState, useRef, useEffect } from 'react'
import { peopleService } from '../../services/peopleService'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const EMPTY = {
  name: '', email: '', phone: '', occupation: '',
  company: '', location: '', notes: '', skills: [],
}

export default function PersonForm({ onSubmit, initialData = null, onClose }) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          name: initialData.name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          occupation: initialData.occupation || '',
          company: initialData.company || '',
          location: initialData.location || '',
          notes: initialData.notes || '',
          skills: Array.isArray(initialData.skills) ? [...initialData.skills] : [],
        }
      : { ...EMPTY }
  )
  const [skillInput, setSkillInput] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(
    initialData?.photo_url
      ? (initialData.photo_url.startsWith('http') ? initialData.photo_url : `${API_BASE}${initialData.photo_url}`)
      : null
  )
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const nameRef = useRef(null)
  const photoInputRef = useRef(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const addSkill = () => {
    const skill = skillInput.trim()
    if (skill && !form.skills.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, skill] }))
    }
    setSkillInput('')
  }

  const removeSkill = (skill) =>
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill() }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setErrors({ name: 'Name is required' }); return }
    setSubmitting(true)
    try {
      const payload = { ...form }
      Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null })
      payload.skills = form.skills
      const savedPerson = await onSubmit(payload)

      // Upload photo if one was selected and we have a person id
      if (photoFile && savedPerson?.id) {
        setUploadingPhoto(true)
        try {
          await peopleService.uploadPhoto(savedPerson.id, photoFile)
        } catch { /* photo upload failure is non-blocking */ }
        setUploadingPhoto(false)
      }
      onClose()
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Something went wrong' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-head">
          <span className="modal-title">{initialData ? 'Edit person' : 'Add person'}</span>
          <button className="icon-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} id="person-form">
            {errors.submit && (
              <div style={{
                marginBottom: 16, padding: '10px 14px', borderRadius: 8,
                background: 'oklch(0.70 0.18 25 / 0.12)',
                border: '1px solid oklch(0.70 0.18 25 / 0.35)',
                fontSize: 13, color: 'var(--bad)',
              }}>
                {errors.submit}
              </div>
            )}

            {/* Photo upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <div
                onClick={() => photoInputRef.current?.click()}
                style={{
                  width: 72, height: 72, borderRadius: '50%', cursor: 'pointer',
                  background: photoPreview ? 'transparent' : 'var(--surface-2)',
                  border: '2px dashed var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0, position: 'relative',
                  transition: 'border-color .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-dim)' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                )}
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange}/>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-mid)', marginBottom: 4 }}>Profile photo</div>
                <button type="button" className="btn-ghost small" onClick={() => photoInputRef.current?.click()}>
                  {photoPreview ? 'Change photo' : 'Upload photo'}
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    className="link-btn"
                    style={{ marginLeft: 10 }}
                    onClick={() => { setPhotoPreview(null); setPhotoFile(null) }}
                  >
                    Remove
                  </button>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>JPG, PNG or WebP · max 5 MB</div>
              </div>
            </div>

            <div className="form-section-title">Identity</div>

            <label className="field">
              <span>Name <span style={{ color: 'var(--bad)' }}>*</span></span>
              <input
                ref={nameRef}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full name"
                style={errors.name ? { borderColor: 'var(--bad)' } : {}}
              />
              {errors.name && <span style={{ fontSize: 11, color: 'var(--bad)' }}>{errors.name}</span>}
            </label>

            <div className="form-row">
              <label className="field" style={{ margin: 0 }}>
                <span>Occupation</span>
                <input name="occupation" value={form.occupation} onChange={handleChange} placeholder="Software Engineer"/>
              </label>
              <label className="field" style={{ margin: 0 }}>
                <span>Company</span>
                <input name="company" value={form.company} onChange={handleChange} placeholder="Acme Inc."/>
              </label>
            </div>

            <div className="form-section-title">Contact</div>

            <div className="form-row">
              <label className="field" style={{ margin: 0 }}>
                <span>Email</span>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com"/>
              </label>
              <label className="field" style={{ margin: 0 }}>
                <span>Phone</span>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 8900"/>
              </label>
            </div>

            <label className="field">
              <span>Location</span>
              <input name="location" value={form.location} onChange={handleChange} placeholder="City, Country"/>
            </label>

            <div className="form-section-title">Skills</div>

            <div className="skill-input">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="Type a skill and press Enter"
                style={{ height: 38, padding: '0 12px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 0, color: 'var(--text)' }}
              />
              <button type="button" className="btn-ghost" onClick={addSkill}>Add</button>
            </div>
            {form.skills.length > 0 && (
              <div className="chip-row editable">
                {form.skills.map(skill => (
                  <span key={skill} className="chip removable">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>×</button>
                  </span>
                ))}
              </div>
            )}

            <div className="form-section-title">Notes</div>

            <label className="field">
              <span>Notes</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="How you know this person, context…"
                rows={3}
              />
            </label>
          </form>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="person-form" className="btn-primary" disabled={submitting || uploadingPhoto}>
            {uploadingPhoto ? 'Uploading photo…' : submitting ? 'Saving…' : initialData ? 'Save changes' : 'Add person'}
          </button>
        </div>
      </div>
    </div>
  )
}
