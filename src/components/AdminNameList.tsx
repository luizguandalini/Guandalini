import { useEffect, useState } from 'react'
import styles from './AdminAuthors.module.css'

interface NamedItem { id: string; name: string }

interface AdminNameListProps<T extends NamedItem> {
  /** Called once on mount; should return a promise resolving to { items }. */
  load:      () => Promise<{ items: T[] }>
  /** Called to persist a new item. */
  create:    (name: string) => Promise<T>
  /** Called to rename an existing item. */
  update:    (id: string, name: string) => Promise<T>
  /** Called to delete. */
  remove:    (id: string) => Promise<{ ok: true }>
  /** Singular label, e.g. "categoria". */
  singular:  string
  /** Maximum characters for the name field. */
  maxLength: number
  /** Placeholder text for the input. */
  placeholder: string
}

export function AdminNameList<T extends NamedItem>(props: AdminNameListProps<T>) {
  const { load, create, update, remove, singular, maxLength, placeholder } = props

  const [items, setItems] = useState<T[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load().then((d) => setItems(d.items)).finally(() => setLoading(false))
  }, [load])

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!newName.trim()) return
    try {
      const created = await create(newName.trim())
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar')
    }
  }

  const startEdit = (it: T) => {
    setEditingId(it.id)
    setEditingName(it.name)
    setError(null)
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      const updated = await update(editingId, editingName.trim())
      setItems((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x))
            .sort((a, b) => a.name.localeCompare(b.name)),
      )
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar')
    }
  }

  const doRemove = async (it: T) => {
    if (!confirm(`Remover a ${singular} "${it.name}"?`)) return
    try {
      await remove(it.id)
      setItems((prev) => prev.filter((x) => x.id !== it.id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover')
    }
  }

  return (
    <>
      <form className={styles.toolbar} onSubmit={submitNew} style={{ gap: 12 }}>
        <input
          type="text"
          maxLength={maxLength}
          className={styles.input}
          placeholder={placeholder}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className={styles.primaryBtn} disabled={!newName.trim()}>
          Adicionar
        </button>
      </form>

      {error && <div className={styles.error} style={{ marginBottom: 12 }}>{error}</div>}

      <div className={styles.list}>
        {items.map((it) => (
          <div key={it.id} className={styles.row}>
            {editingId === it.id ? (
              <>
                <input
                  type="text"
                  maxLength={maxLength}
                  className={styles.input}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <div className={styles.rowActions}>
                  <button className={styles.actionBtn} onClick={saveEdit}>Salvar</button>
                  <button className={styles.actionBtn} onClick={() => setEditingId(null)}>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.rowInfo}>
                  <span className={styles.rowName}>{it.name}</span>
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.actionBtn} onClick={() => startEdit(it)}>Editar</button>
                  <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => doRemove(it)}>Remover</button>
                </div>
              </>
            )}
          </div>
        ))}

        {items.length === 0 && !loading && (
          <div className={styles.empty}>Nenhum item cadastrado ainda.</div>
        )}
        {loading && <div className={styles.loading}>Carregando…</div>}
      </div>
    </>
  )
}
