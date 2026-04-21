import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { authorsApi } from '../api'
import type { Author, AvatarCrop } from '../types'
import { Avatar } from './Avatar'
import { AvatarCropper } from './AvatarCropper'
import styles from './AdminAuthors.module.css'

const PAGE_SIZE = 8
const DEFAULT_CROP: AvatarCrop = { x: 0, y: 0, scale: 1 }

const DICEBEAR_SEEDS = [
  'luiz', 'hulk', 'pedro', 'ana', 'julia', 'mike', 'rafa', 'joao', 'laura',
]
const dicebearUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b8c9c0`

export function AdminAuthors() {
  const [items,   setItems]   = useState<Author[]>([])
  const [page,    setPage]    = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const [formOpen,     setFormOpen]     = useState(false)
  const [editing,      setEditing]      = useState<Author | null>(null)

  const [name,       setName]       = useState('')
  const [role,       setRole]       = useState('')
  const [file,       setFile]       = useState<File | null>(null)
  const [filePreview,setFilePreview]= useState<string | null>(null)
  const [crop,       setCrop]       = useState<AvatarCrop>(DEFAULT_CROP)
  const [avatarMode, setAvatarMode] = useState<'upload' | 'dicebear'>('dicebear')
  const [dicebearSeed, setDicebearSeed] = useState('luiz')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting,  setSubmitting]  = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)

  // ── Load pages ──
  const loadPage = useCallback(async (p: number, replace = false) => {
    setLoading(true)
    try {
      const data = await authorsApi.list(p, PAGE_SIZE)
      setItems((prev) => (replace ? data.items : [...prev, ...data.items]))
      setHasMore(data.hasMore)
      setPage(p)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPage(1, true) }, [loadPage])

  // ── Infinite scroll ──
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadPage(page + 1)
      }
    }, { rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadPage, page])

  // ── Form helpers ──
  const resetForm = () => {
    setEditing(null)
    setName(''); setRole('')
    setFile(null); setFilePreview(null)
    setCrop(DEFAULT_CROP)
    setAvatarMode('dicebear')
    setDicebearSeed('luiz')
    setSubmitError(null)
  }

  const openCreate = () => {
    resetForm()
    setFormOpen(true)
  }

  const openEdit = (a: Author) => {
    resetForm()
    setEditing(a)
    setName(a.name); setRole(a.role)
    if (a.avatarType === 'upload') {
      setAvatarMode('upload')
      setFilePreview(a.avatarUrl)
      setCrop(a.avatarCrop ?? DEFAULT_CROP)
    } else {
      setAvatarMode('dicebear')
      const match = a.avatarUrl.match(/seed=([^&]+)/)
      setDicebearSeed(match ? decodeURIComponent(match[1]) : 'luiz')
    }
    setFormOpen(true)
  }

  const onFilePicked = (f: File | null) => {
    setFile(f)
    if (!f) { setFilePreview(null); return }
    const url = URL.createObjectURL(f)
    setFilePreview(url)
    setCrop(DEFAULT_CROP)
    setAvatarMode('upload')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!name.trim() || !role.trim()) {
      setSubmitError('Preencha o nome e a função')
      return
    }
    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('name', name.trim())
      form.append('role', role.trim())
      if (avatarMode === 'upload' && file) {
        form.append('avatar', file)
        form.append('avatarCrop', JSON.stringify(crop))
      } else if (avatarMode === 'upload' && editing && editing.avatarType === 'upload') {
        form.append('avatarCrop', JSON.stringify(crop))
      } else {
        form.append('dicebearSeed', dicebearSeed)
      }

      if (editing) {
        const updated = await authorsApi.update(editing.id, form)
        setItems((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      } else {
        const created = await authorsApi.create(form)
        setItems((prev) => [created, ...prev])
      }
      setFormOpen(false)
      resetForm()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (a: Author) => {
    if (!confirm(`Remover o autor "${a.name}"?`)) return
    try {
      await authorsApi.remove(a.id)
      setItems((prev) => prev.filter((x) => x.id !== a.id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover')
    }
  }

  const previewSrc = useMemo(() => {
    if (avatarMode === 'upload') return filePreview
    return dicebearUrl(dicebearSeed)
  }, [avatarMode, filePreview, dicebearSeed])

  return (
    <>
      <div className={styles.toolbar}>
        <span className={styles.counter}>{items.length} autor(es) cadastrado(s)</span>
        <button className={styles.primaryBtn} onClick={openCreate}>
          <span style={{ marginRight: 6 }}>+</span>Novo autor
        </button>
      </div>

      {/* ── List ────────────────────────────────────── */}
      <div className={styles.list}>
        {items.map((a) => (
          <div key={a.id} className={styles.row}>
            <Avatar src={a.avatarUrl} name={a.name} crop={a.avatarCrop} size={56} />
            <div className={styles.rowInfo}>
              <span className={styles.rowName}>{a.name}</span>
              <span className={styles.rowRole}>{a.role}</span>
            </div>
            <div className={styles.rowActions}>
              <button className={styles.actionBtn} onClick={() => openEdit(a)}>Editar</button>
              <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => remove(a)}>Remover</button>
            </div>
          </div>
        ))}

        {items.length === 0 && !loading && (
          <div className={styles.empty}>Nenhum autor cadastrado. Crie o primeiro acima.</div>
        )}

        <div ref={sentinelRef} style={{ height: 1 }} />
        {loading && <div className={styles.loading}>Carregando…</div>}
      </div>

      {/* ── Form modal ──────────────────────────────── */}
      {formOpen && (
        <div className={styles.modalBackdrop} onClick={() => setFormOpen(false)}>
          <form
            className={styles.modal}
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>
              {editing ? 'Editar autor' : 'Novo autor'}
            </h2>

            <div className={styles.avatarSection}>
              {previewSrc
                ? <Avatar src={previewSrc} name={name || 'Preview'} crop={avatarMode === 'upload' ? crop : null} size={96} />
                : <div className={styles.avatarPlaceholder}>?</div>}

              <div className={styles.avatarTabs}>
                <button
                  type="button"
                  className={`${styles.tab} ${avatarMode === 'upload' ? styles.tabActive : ''}`}
                  onClick={() => setAvatarMode('upload')}
                >
                  Foto
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${avatarMode === 'dicebear' ? styles.tabActive : ''}`}
                  onClick={() => setAvatarMode('dicebear')}
                >
                  Avatar
                </button>
              </div>
            </div>

            {avatarMode === 'upload' && (
              <>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className={styles.fileInput}
                  onChange={(e) => onFilePicked(e.target.files?.[0] ?? null)}
                />
                {filePreview && (
                  <AvatarCropper src={filePreview} value={crop} onChange={setCrop} />
                )}
              </>
            )}

            {avatarMode === 'dicebear' && (
              <div className={styles.seedGrid}>
                {DICEBEAR_SEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.seedOption} ${dicebearSeed === s ? styles.seedActive : ''}`}
                    onClick={() => setDicebearSeed(s)}
                  >
                    <img src={dicebearUrl(s)} alt={s} />
                  </button>
                ))}
              </div>
            )}

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nome</span>
              <input
                type="text"
                maxLength={120}
                className={styles.input}
                value={name}
                placeholder="ex: Hulk"
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Função</span>
              <input
                type="text"
                maxLength={120}
                className={styles.input}
                value={role}
                placeholder="ex: Cachorro do Editor-chefe"
                onChange={(e) => setRole(e.target.value)}
              />
            </label>

            {submitError && <div className={styles.error}>{submitError}</div>}

            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setFormOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                {submitting ? 'Salvando…' : editing ? 'Salvar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
