import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useNetworkContext } from '../context/NetworkContext'
import { peopleService } from '../services/peopleService'
import { connectionService } from '../services/connectionService'
import { CATEGORIES, getCategory } from '../utils/graphHelpers'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const EMPTY = {
  name: '', email: '', phone: '',
  occupation: '', company: '', location: '',
  notes: '', skills: [],
}

function getInitials(name = '') {
  return (name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() || '?'
}

// ── Live preview card ─────────────────────────────────────────────────────────
function LivePreviewCard({ form, photoPreview }) {
  const cat = getCategory(form.occupation)
  const catInfo = CATEGORIES[cat]
  const hue = (form.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360

  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {photoPreview ? (
          <img src={photoPreview} alt="preview"
            style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: `hsl(${hue}, 50%, 38%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 19, letterSpacing: '0.01em',
          }}>
            {getInitials(form.name)}
          </div>
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.2 }}>
            {form.name || <span style={{ color: 'var(--text-dim)' }}>Person name</span>}
          </div>
          {form.occupation && (
            <div style={{ fontSize: 12.5, color: 'var(--text-mut)', marginTop: 3 }}>{form.occupation}</div>
          )}
          {form.company && (
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{form.company}</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span className="cat-pill small" style={{ color: catInfo.color, borderColor: catInfo.color + '55' }}>
          {catInfo.label}
        </span>
      </div>

      {form.skills.length > 0 && (
        <div className="chip-row tight" style={{ marginTop: -2 }}>
          {form.skills.slice(0, 4).map(s => <span key={s} className="chip">{s}</span>)}
          {form.skills.length > 4 && <span className="chip muted">+{form.skills.length - 4}</span>}
        </div>
      )}

      {(form.email || form.location) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2 }}>
          {form.email && (
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>@ {form.email}</span>
          )}
          {form.location && (
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>⌖ {form.location}</span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PersonEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { people, loadPeople, addPerson, updatePerson } = useNetworkContext()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ ...EMPTY })
  const [skillInput, setSkillInput] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [pageLoading, setPageLoading] = useState(isEdit)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [connectToId, setConnectToId] = useState('')
  const [connectRelType, setConnectRelType] = useState('colleague')
  const [isSelf, setIsSelf] = useState(false)

  const nameRef = useRef(null)
  const photoInputRef = useRef(null)

  // Load person data when editing
  useEffect(() => {
    if (!isEdit) {
      loadPeople()
      setTimeout(() => nameRef.current?.focus(), 50)
      return
    }
    let cancelled = false
    peopleService.getById(id)
      .then(res => {
        if (cancelled) return
        const p = res.data
        setForm({
          name: p.name || '',
          email: p.email || '',
          phone: p.phone || '',
          occupation: p.occupation || '',
          company: p.company || '',
          location: p.location || '',
          notes: p.notes || '',
          skills: Array.isArray(p.skills) ? [...p.skills] : [],
        })
        setIsSelf(p.is_self || false)
        if (p.photo_url) {
          setPhotoPreview(p.photo_url.startsWith('http') ? p.photo_url : `${API_BASE}${p.photo_url}`)
        }
      })
      .catch(() => navigate('/people'))
      .finally(() => { if (!cancelled) setPageLoading(false) })
    loadPeople()
    return () => { cancelled = true }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !form.skills.includes(s)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, s] }))
    }
    setSkillInput('')
  }

  const removeSkill = (s) => setForm(prev => ({ ...prev, skills: prev.skills.filter(k => k !== s) }))

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!form.name.trim()) { setErrors({ name: 'Name is required' }); return }
    setSubmitting(true)
    try {
      const payload = { ...form }
      Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null })
      payload.skills = form.skills

      let savedPerson
      if (isEdit) {
        savedPerson = await updatePerson(id, payload)
      } else {
        savedPerson = await addPerson(payload)
      }

      // Upload photo if selected
      if (photoFile && savedPerson?.id) {
        setUploadingPhoto(true)
        try { await peopleService.uploadPhoto(savedPerson.id, photoFile) } catch { /* non-blocking */ }
        setUploadingPhoto(false)
      }

      // Auto-connect if selected (add mode only)
      if (!isEdit && connectToId && savedPerson?.id) {
        try {
          await connectionService.create({
            person1_id: savedPerson.id,
            person2_id: connectToId,
            relationship_type: connectRelType,
          })
        } catch { /* non-blocking */ }
      }

      navigate(isEdit ? `/people/${id}` : '/people')
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Something went wrong' })
    } finally {
      setSubmitting(false)
    }
  }

  const cat = getCategory(form.occupation)
  const otherPeople = people.filter(p => p.id !== id)
  const selfPerson = people.find(p => p.is_self)

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div className="spinner" style={{ width: 28, height: 28 }}/>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        paddingBottom: 24, flexShrink: 0,
      }}>
        <div>
          <div style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--accent-2)', marginBottom: 6,
          }}>
            {isEdit ? 'Edit contact' : 'Add contact'}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.15 }}>
            {form.name || (isEdit ? 'Edit person' : 'New contact')}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-mut)', margin: '6px 0 0' }}>
            {isSelf ? 'Keep your details current.' : isEdit ? 'Update contact details.' : 'Fill in the details to add to your network.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <button className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting || uploadingPhoto}
          >
            {uploadingPhoto ? 'Uploading photo…' : submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add person'}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>

        {/* ── Left: form ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', paddingRight: 4 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {errors.submit && (
              <div style={{
                marginBottom: 12, padding: '10px 14px', borderRadius: 8,
                background: 'oklch(0.70 0.18 25 / 0.12)',
                border: '1px solid oklch(0.70 0.18 25 / 0.35)',
                fontSize: 13, color: 'var(--bad)',
              }}>
                {errors.submit}
              </div>
            )}

            {/* Photo row */}
            <div className="card" style={{ padding: '18px 20px', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div
                  onClick={() => photoInputRef.current?.click()}
                  style={{
                    width: 76, height: 76, borderRadius: '50%', cursor: 'pointer',
                    background: photoPreview ? 'transparent' : 'var(--surface-2)',
                    border: '2px dashed var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0, transition: 'border-color .15s',
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 6 }}>Profile photo</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button type="button" className="btn-ghost small" onClick={() => photoInputRef.current?.click()}>
                      {photoPreview ? 'Change photo' : 'Upload photo'}
                    </button>
                    {photoPreview && (
                      <button type="button" className="link-btn" onClick={() => { setPhotoPreview(null); setPhotoFile(null) }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 5 }}>JPG, PNG or WebP · max 5 MB</div>
                </div>
              </div>
            </div>

            {/* IDENTITY */}
            <div className="card" style={{ padding: '18px 20px', marginBottom: 4 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 14 }}>
                Identity
              </div>
              <label className="field" style={{ marginBottom: 12 }}>
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
                  <span>Email</span>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com"/>
                </label>
                <label className="field" style={{ margin: 0 }}>
                  <span>Phone</span>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 8900"/>
                </label>
              </div>
              <label className="field" style={{ marginTop: 12, marginBottom: 0 }}>
                <span>Location</span>
                <input name="location" value={form.location} onChange={handleChange} placeholder="City, Country"/>
              </label>
            </div>

            {/* WORK */}
            <div className="card" style={{ padding: '18px 20px', marginBottom: 4 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 14 }}>
                Work
              </div>
              <div className="form-row" style={{ marginBottom: 14 }}>
                <label className="field" style={{ margin: 0 }}>
                  <span>Occupation</span>
                  <input name="occupation" value={form.occupation} onChange={handleChange} placeholder="Software Engineer"/>
                </label>
                <label className="field" style={{ margin: 0 }}>
                  <span>Company</span>
                  <input name="company" value={form.company} onChange={handleChange} placeholder="Acme Inc."/>
                </label>
              </div>

              {/* Category indicator */}
              <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 8 }}>Category</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {Object.entries(CATEGORIES).map(([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    style={{
                      padding: '5px 13px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                      cursor: 'default',
                      border: `1.5px solid ${cat === key ? info.color + 'aa' : 'var(--border)'}`,
                      background: cat === key ? info.color + '22' : 'transparent',
                      color: cat === key ? info.color : 'var(--text-dim)',
                      transition: 'all .15s',
                    }}
                  >
                    <span style={{
                      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                      background: cat === key ? info.color : 'var(--text-dim)',
                      marginRight: 6, verticalAlign: 'middle',
                    }}/>
                    {info.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
                Auto-detected from occupation
              </div>
            </div>

            {/* SKILLS */}
            <div className="card" style={{ padding: '18px 20px', marginBottom: 4 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 14 }}>
                Skills
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginBottom: 8 }}>Add skill tags</div>
              <div className="skill-input" style={{ marginBottom: form.skills.length > 0 ? 10 : 0 }}>
                <input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  placeholder="Type a skill, press Enter"
                  style={{
                    flex: 1, height: 38, padding: '0 12px',
                    background: 'var(--bg-2)', border: '1px solid var(--border)',
                    borderRadius: 8, fontSize: 13, outline: 0, color: 'var(--text)',
                  }}
                />
                <button type="button" className="btn-ghost" onClick={addSkill}>Add</button>
              </div>
              {form.skills.length > 0 && (
                <div className="chip-row editable">
                  {form.skills.map(s => (
                    <span key={s} className="chip removable">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* NOTES */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 14 }}>
                Notes
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-mid)', marginBottom: 8 }}>Anything to remember</div>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="How you met, what to follow up on…"
                rows={4}
                style={{
                  width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: 8, fontSize: 13, color: 'var(--text)', resize: 'vertical',
                  outline: 0, fontFamily: 'inherit', lineHeight: 1.6,
                }}
              />
            </div>

          </form>
        </div>

        {/* ── Right: preview + connect ────────────────────────────────── */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Live preview */}
          <div>
            <div style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 10,
            }}>
              Live preview
            </div>
            <LivePreviewCard form={form} photoPreview={photoPreview}/>
          </div>

          {/* Connect to (add mode only) */}
          {!isEdit && otherPeople.length > 0 && (
            <div>
              <div style={{
                fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 10,
              }}>
                Connect to
              </div>
              <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-mut)' }}>
                  Who introduced you, or who do they know in your network?
                </div>
                <label className="field" style={{ margin: 0 }}>
                  <span>Connect with</span>
                  <select
                    value={connectToId}
                    onChange={e => setConnectToId(e.target.value)}
                    style={{
                      height: 38, padding: '0 10px',
                      background: 'var(--bg-2)', border: '1px solid var(--border)',
                      borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 0,
                    }}
                  >
                    <option value="">— No connection yet —</option>
                    {selfPerson && (
                      <option value={selfPerson.id}>You (yourself)</option>
                    )}
                    {otherPeople.filter(p => !p.is_self).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
                {connectToId && (
                  <label className="field" style={{ margin: 0 }}>
                    <span>Relationship</span>
                    <select
                      value={connectRelType}
                      onChange={e => setConnectRelType(e.target.value)}
                      style={{
                        height: 38, padding: '0 10px',
                        background: 'var(--bg-2)', border: '1px solid var(--border)',
                        borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 0,
                      }}
                    >
                      {['colleague', 'friend', 'family', 'mentor', 'other'].map(t => (
                        <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
