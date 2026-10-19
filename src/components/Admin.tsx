import { useEffect, useState, type FormEvent } from 'react'
import {
  CalendarDays, ChevronRight, Eye, EyeOff, Image, LayoutDashboard, LogOut, Plus,
  Save, Settings2, Shield, Trash2, Upload, Users, X,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { categories, defaultSettings, type EventItem, type GalleryItem, type SiteSettings } from '../types'

type Section = 'overview' | 'content' | 'gallery' | 'events'
const sectionNames: Record<Section, string> = { overview: 'Ringkasan', content: 'Konten & tampilan', gallery: 'Galeri foto', events: 'Kegiatan' }

export default function Admin({ onUpdated }: { onUpdated: () => void }) {
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [section, setSection] = useState<Section>('overview')

  useEffect(() => {
    if (!supabase) { setAuthChecked(true); return }
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) setMessage(error.message)
      setUser(data.session?.user ?? null)
      setAuthChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true); setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    setMessage(error ? `Login gagal: ${error.message}` : 'Login berhasil.')
  }

  async function signOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) setMessage(`Logout gagal: ${error.message}`)
    else setMessage('Anda telah logout.')
  }

  if (!supabase) return <div className="admin-gate"><div className="admin-gate-card"><Shield size={32} /><div className="eyebrow">RUANG PENGELOLA</div><h1>Hubungkan Supabase</h1><p>Pengelolaan konten dinonaktifkan sampai konfigurasi backend tersedia. Salin <code>.env.example</code> menjadi <code>.env.local</code>, lalu isi URL proyek dan publishable key Supabase.</p></div></div>
  if (!authChecked) return <div className="loading-state"><span className="spinner" />Memeriksa sesi pengurus...</div>
  if (!user) return <div className="admin-gate"><form className="login-card" onSubmit={(event) => void signIn(event)}><div className="admin-brandmark"><Shield /></div><div className="eyebrow">RUANG PENGELOLA</div><h1>Selamat datang.</h1><p>Masuk dengan akun administrator Rukun Santo Michael.</p><label>Email administrator<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Kata sandi<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button button-purple full-button" disabled={busy}>{busy ? 'Memeriksa...' : 'Masuk ke dashboard'} <ChevronRight size={16} /></button>{message && <p className="form-message" role="status">{message}</p>}<small className="login-hint">Akun pengurus dibuat melalui Supabase Auth. Tidak ada pendaftaran publik.</small></form></div>
  if (user.app_metadata?.role !== 'admin') return <div className="admin-gate"><div className="admin-gate-card"><Shield size={32} /><div className="eyebrow">AKSES TERBATAS</div><h1>Akun belum memiliki akses pengurus.</h1><p>Hubungi administrator Supabase untuk mengatur app_metadata.role menjadi <code>admin</code>. Hak akses juga diperiksa oleh kebijakan server.</p><button className="button button-purple" onClick={() => void signOut()}>Keluar <LogOut size={15} /></button></div></div>

  return <AdminDashboard user={user} section={section} setSection={setSection} onLogout={signOut} onUpdated={onUpdated} message={message} />
}

function AdminDashboard({ user, section, setSection, onLogout, onUpdated, message }: {
  user: User; section: Section; setSection: (section: Section) => void; onLogout: () => void; onUpdated: () => void; message: string
}) {
  return <div className="admin-layout">
    <aside className="admin-sidebar"><div className="admin-sidebar-brand"><Shield /><span><strong>RUANG PENGELOLA</strong><small>RUKUN SANTO MICHAEL</small></span></div><small className="sidebar-label">MENU UTAMA</small>{(Object.keys(sectionNames) as Section[]).map((key) => <button key={key} className={section === key ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setSection(key)}>{key === 'overview' ? <LayoutDashboard /> : key === 'content' ? <Settings2 /> : key === 'gallery' ? <Image /> : <CalendarDays />}{sectionNames[key]}</button>)}<div className="sidebar-bottom"><span><Users size={15} /> {user.email}</span><button className="sidebar-link" onClick={onLogout}><LogOut /> Keluar</button></div></aside>
    <div className="admin-main"><header className="admin-topbar"><div><small>RUKUN SANTO MICHAEL / PENGELOLA</small><h1>{sectionNames[section]}</h1></div><span className="admin-status"><i /> Terhubung dengan Supabase</span></header>{message && <p className="admin-flash" role="status">{message}</p>}<div className="admin-panel">{section === 'overview' ? <Overview setSection={setSection} /> : section === 'content' ? <ContentEditor onUpdated={onUpdated} /> : section === 'gallery' ? <GalleryManager onUpdated={onUpdated} /> : <EventManager onUpdated={onUpdated} />}</div></div>
  </div>
}

function Overview({ setSection }: { setSection: (section: Section) => void }) {
  const [counts, setCounts] = useState({ photos: 0, events: 0, upcoming: 0, past: 0 })
  const [updatedAt, setUpdatedAt] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let ignore = false
    async function load() {
      if (!supabase) return
      const [gallery, events, settings] = await Promise.all([
        supabase.from('gallery_items').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('event_date'),
        supabase.from('site_settings').select('updated_at').eq('id', 1).maybeSingle(),
      ])
      const failure = gallery.error || events.error || settings.error
      if (failure) { if (!ignore) setError(failure.message); return }
      const records = events.data ?? []
      const upcoming = records.filter((item) => item.event_date >= new Date().toISOString().slice(0, 10)).length
      if (!ignore) {
        setCounts({ photos: gallery.count ?? 0, events: records.length, upcoming, past: records.length - upcoming })
        setUpdatedAt(settings.data?.updated_at ?? '')
      }
    }
    void load()
    return () => { ignore = true }
  }, [])
  return <div className="dashboard-content"><div className="dashboard-welcome"><div><div className="eyebrow">SALAM PERSAUDARAAN</div><h2>Selamat berkarya, Pengurus.</h2><p>Kelola informasi dan dokumentasi Rukun Santo Michael dari satu tempat.</p></div><Shield size={38} /></div><div className="stat-grid">{[['Foto galeri', counts.photos], ['Kegiatan', counts.events], ['Akan datang', counts.upcoming], ['Telah selesai', counts.past]].map(([label, value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>{error && <p className="form-message error">{error} Pastikan schema Supabase sudah diterapkan.</p>}<div className="dashboard-shortcuts"><h3>Pengelolaan cepat</h3><button onClick={() => setSection('content')}><Settings2 /> Perbarui konten, warna, media sosial <ChevronRight /></button><button onClick={() => setSection('gallery')}><Image /> Tambahkan dokumentasi foto <ChevronRight /></button><button onClick={() => setSection('events')}><CalendarDays /> Buat kegiatan baru <ChevronRight /></button></div><p className="last-updated">Konten terakhir diperbarui: {updatedAt ? new Date(updatedAt).toLocaleString('id-ID') : 'belum tersedia'}</p></div>
}

const textSettings: Array<[keyof SiteSettings, string, boolean?]> = [
  ['organization_name', 'Nama rukun'], ['tagline', 'Slogan'], ['location', 'Lokasi stasi dan paroki'],
  ['welcome_title', 'Judul sambutan'], ['welcome_text', 'Sambutan', true], ['history', 'Sejarah / pengenalan', true],
  ['vision', 'Visi', true], ['mission', 'Misi', true], ['map_query', 'Kata kunci pencarian Maps'],
  ['contact_email', 'Email kontak'], ['contact_phone', 'Nomor telepon'],
  ['facebook_url', 'URL Facebook'], ['instagram_url', 'URL Instagram'],
]

function ContentEditor({ onUpdated }: { onUpdated: () => void }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [preview, setPreview] = useState(false)
  const [newSection, setNewSection] = useState({ title: '', body: '' })
  const [extraSections, setExtraSections] = useState<Array<{ id: string; title: string; body: string }>>([])
  useEffect(() => {
    let ignore = false
    async function load() {
      if (!supabase) return
      const [result, sections] = await Promise.all([
        supabase.from('site_settings').select('settings').eq('id', 1).maybeSingle(),
        supabase.from('content_sections').select('id,title,body').order('sort_order'),
      ])
      if (result.error || sections.error) setNotice(result.error?.message ?? sections.error?.message ?? '')
      if (!ignore) {
        setSettings({ ...defaultSettings, ...(result.data?.settings ?? {}) })
        setExtraSections(sections.data ?? [])
        setLoading(false)
      }
    }
    void load()
    return () => { ignore = true }
  }, [])
  const set = (key: keyof SiteSettings, value: string | number | boolean) => setSettings((current) => ({ ...current, [key]: value }))

  async function uploadLogo(file?: File) {
    if (!file || !supabase) return
    try {
      const path = await uploadImage(file)
      set('logo_url', publicUrl(path))
      setNotice('Logo diunggah. Simpan perubahan untuk menerbitkannya.')
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Logo gagal diunggah.') }
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true); setNotice('')
    const { error } = await supabase.from('site_settings').upsert({ id: 1, settings, updated_at: new Date().toISOString() })
    setBusy(false)
    if (error) setNotice(`Gagal menyimpan: ${error.message}`)
    else { setNotice('Perubahan berhasil disimpan dan diterbitkan.'); onUpdated() }
  }
  async function addSection() {
    if (!supabase || !newSection.title.trim() || !newSection.body.trim()) return
    const { data, error } = await supabase.from('content_sections').insert({ title: newSection.title, body: newSection.body, sort_order: extraSections.length }).select('id,title,body').single()
    if (error) setNotice(`Bagian gagal ditambahkan: ${error.message}`)
    else { setExtraSections((current) => [...current, data]); setNewSection({ title: '', body: '' }); setNotice('Bagian tambahan berhasil disimpan.'); onUpdated() }
  }
  async function removeSection(id: string) {
    if (!supabase || !window.confirm('Hapus bagian tambahan ini?')) return
    const { error } = await supabase.from('content_sections').delete().eq('id', id)
    if (error) setNotice(`Bagian gagal dihapus: ${error.message}`)
    else setExtraSections((current) => current.filter((item) => item.id !== id))
  }
  async function saveSection(section: { id: string; title: string; body: string }) {
    if (!supabase) return
    const { error } = await supabase.from('content_sections').update({ title: section.title, body: section.body }).eq('id', section.id)
    if (error) setNotice(`Bagian gagal diperbarui: ${error.message}`)
    else { setNotice('Bagian berhasil diperbarui.'); onUpdated() }
  }
  if (loading) return <div className="loading-state"><span className="spinner" />Memuat pengaturan...</div>
  return <form className="editor-form" onSubmit={(event) => void save(event)}><div className="editor-heading"><div><h2>Identitas dan informasi</h2><p>Konten berlabel [DRAF] harus dilengkapi pengurus dengan informasi resmi.</p></div><div className="editor-heading-actions"><button type="button" className="button button-outline-dark" onClick={() => setPreview(!preview)}>{preview ? <EyeOff size={16} /> : <Eye size={16} />}{preview ? 'Tutup pratinjau' : 'Pratinjau'}</button><button className="button button-purple" disabled={busy}><Save size={16} />{busy ? 'Menyimpan...' : 'Simpan Perubahan'}</button></div></div>
    {preview && <div className="content-preview" style={{ borderTopColor: settings.theme_color }}><div className="eyebrow">PRATINJAU BERANDA</div><h2>{settings.organization_name}</h2><p className="preview-tagline">{settings.tagline}</p><p>{settings.welcome_title}</p><p>{settings.welcome_text}</p><small>{settings.location}</small><div className="preview-color" style={{ background: settings.theme_color }}><span>Warna utama</span>{settings.theme_color}</div></div>}
    <div className="form-grid">{textSettings.map(([key, label, multiline]) => <label className={multiline ? 'wide-field' : ''} key={key}>{label}{multiline ? <textarea rows={key === 'welcome_text' ? 3 : 4} value={String(settings[key] ?? '')} onChange={(event) => set(key, event.target.value)} /> : <input type={key === 'contact_email' ? 'email' : key.endsWith('_url') ? 'url' : 'text'} value={String(settings[key] ?? '')} onChange={(event) => set(key, event.target.value)} placeholder={key.endsWith('_url') ? 'Kosongkan untuk menyembunyikan tautan' : ''} />}</label>)}</div>
    <div className="admin-subsection"><h3>Tema website</h3><label>Warna utama<div className="color-control"><input type="color" value={settings.theme_color} onChange={(event) => set('theme_color', event.target.value)} /><input value={settings.theme_color} onChange={(event) => set('theme_color', event.target.value)} aria-label="Kode warna utama" /></div></label><p>Perubahan warna berlaku setelah disimpan.</p></div>
    <div className="admin-subsection logo-settings"><h3>Logo dan animasi</h3>{settings.logo_url && <img className="logo-preview" src={settings.logo_url} alt="Pratinjau logo" />}<label className="file-picker"><Upload size={17} /> Pilih gambar logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadLogo(event.target.files?.[0])} /></label><label>Ukuran logo: {settings.logo_size}px<input type="range" min="140" max="360" value={settings.logo_size} onChange={(event) => set('logo_size', Number(event.target.value))} /></label><label className="check-field"><input type="checkbox" checked={settings.logo_animation} onChange={(event) => set('logo_animation', event.target.checked)} /> Aktifkan animasi ringan pada logo</label></div>
    <div className="admin-subsection"><h3>Bagian tambahan halaman Tentang</h3><p>Tambahkan atau ubah cerita dan informasi lain.</p>{extraSections.map((item) => <div className="extra-section-row" key={item.id}><div><label>Judul bagian<input value={item.title} onChange={(event) => setExtraSections((current) => current.map((section) => section.id === item.id ? { ...section, title: event.target.value } : section))} /></label><label>Deskripsi<textarea rows={2} value={item.body} onChange={(event) => setExtraSections((current) => current.map((section) => section.id === item.id ? { ...section, body: event.target.value } : section))} /></label><button type="button" className="button button-outline-dark" onClick={() => void saveSection(item)}><Save size={14} /> Simpan bagian</button></div><button type="button" className="icon-danger" aria-label={`Hapus ${item.title}`} onClick={() => void removeSection(item.id)}><Trash2 size={16} /></button></div>)}<div className="form-grid"><label>Judul bagian<input value={newSection.title} onChange={(event) => setNewSection({ ...newSection, title: event.target.value })} /></label><label>Deskripsi<textarea rows={2} value={newSection.body} onChange={(event) => setNewSection({ ...newSection, body: event.target.value })} /></label></div><button type="button" className="button button-outline-dark" onClick={() => void addSection()}><Plus size={16} /> Tambah Bagian</button></div>
    {notice && <p className="form-message" role="status">{notice}</p>}<div className="editor-footer"><button className="button button-purple" disabled={busy}><Save size={16} />{busy ? 'Menyimpan...' : 'Simpan Perubahan'}</button></div>
  </form>
}

function GalleryManager({ onUpdated }: { onUpdated: () => void }) {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [files, setFiles] = useState<FileList | null>(null)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({ title: '', caption: '', category: categories[0], event_date: '', sort_order: 0 })
  useEffect(() => { void refresh() }, [])
  async function refresh() {
    if (!supabase) return
    const { data, error } = await supabase.from('gallery_items').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false })
    if (error) setNotice(`Galeri gagal dimuat: ${error.message}`)
    else setItems((data ?? []) as GalleryItem[])
  }
  function beginEdit(item?: GalleryItem) {
    setEditing(item ?? null); setFiles(null); setFormOpen(true)
    setForm(item ? { title: item.title, caption: item.caption ?? '', category: item.category, event_date: item.event_date ?? '', sort_order: item.sort_order ?? 0 } : { title: '', caption: '', category: categories[0], event_date: '', sort_order: 0 })
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    if (!editing && !files?.length) { setNotice('Pilih setidaknya satu foto untuk diunggah.'); return }
    setBusy(true); setNotice('')
    let pendingUploads: string[] = []
    try {
      const photos = files ? Array.from(files) : []
      for (const file of photos) validateImage(file)
      let cleanupWarning = ''
      if (!editing) {
        const uploaded = await Promise.all(photos.map(async (file, index) => {
          const path = await uploadImage(file)
          return { path, image_url: publicUrl(path), title: photos.length > 1 && !form.title.trim() ? file.name.replace(/\.[^.]+$/, '') : photos.length > 1 ? `${form.title} ${index + 1}` : form.title }
        }))
        pendingUploads = uploaded.map((photo) => photo.path)
        const { error } = await supabase.from('gallery_items').insert(uploaded.map(({ path: _path, ...photo }, index) => ({ ...form, ...photo, sort_order: form.sort_order + index, event_date: form.event_date || null })))
        if (error) throw error
        pendingUploads = []
      } else {
        const replacementPath = photos[0] ? await uploadImage(photos[0]) : null
        pendingUploads = replacementPath ? [replacementPath] : []
        const image_url = replacementPath ? publicUrl(replacementPath) : editing.image_url
        const { error } = await supabase.from('gallery_items').update({ ...form, image_url, event_date: form.event_date || null }).eq('id', editing.id)
        if (error) throw error
        pendingUploads = []
        if (replacementPath) {
          const oldPath = storagePathFromUrl(editing.image_url)
          if (oldPath) {
            const { error: storageError } = await supabase.storage.from('site-media').remove([oldPath])
            if (storageError) cleanupWarning = `Foto diperbarui, tetapi berkas lama gagal dihapus: ${storageError.message}`
          }
        }
      }
      await refresh(); onUpdated(); setNotice(cleanupWarning || (editing ? 'Foto berhasil diperbarui.' : 'Foto berhasil diunggah ke penyimpanan.')); setEditing(null); setFiles(null); setFormOpen(false)
    } catch (error) {
      let failure = error instanceof Error ? error.message : 'Foto gagal disimpan.'
      if (pendingUploads.length) {
        const { error: cleanupError } = await supabase.storage.from('site-media').remove(pendingUploads)
        if (cleanupError) failure += ` Berkas sementara juga gagal dibersihkan: ${cleanupError.message}`
      }
      setNotice(failure)
    } finally { setBusy(false) }
  }
  async function remove(item: GalleryItem) {
    if (!supabase || !window.confirm(`Hapus foto “${item.title}”? Tindakan ini tidak dapat dibatalkan.`)) return
    const { error } = await supabase.from('gallery_items').delete().eq('id', item.id)
    if (error) setNotice(`Foto gagal dihapus: ${error.message}`)
    else {
      const path = storagePathFromUrl(item.image_url)
      if (path) {
        const { error: storageError } = await supabase.storage.from('site-media').remove([path])
        if (storageError) { setNotice(`Foto dihapus dari galeri, tetapi berkas gagal dihapus: ${storageError.message}`); await refresh(); onUpdated(); return }
      }
      setItems((current) => current.filter((photo) => photo.id !== item.id)); onUpdated(); setNotice('Foto dan berkasnya berhasil dihapus.')
    }
  }
  const filtered = items.filter((item) => item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  return <div className="manager-content"><div className="editor-heading"><div><h2>Dokumentasi foto</h2><p>Unggah foto permanen ke Supabase Storage. Maksimal 5 MB untuk setiap gambar.</p></div><button className="button button-purple" onClick={() => beginEdit()}><Plus size={16} />Tambah Foto</button></div>{notice && <p className="form-message" role="status">{notice}</p>}<label className="search-box admin-search"><span className="sr-only">Cari foto</span><input placeholder="Cari berdasarkan judul..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>{!items.length && <div className="empty-state">Belum ada foto tersimpan. Foto contoh di halaman publik hanya pratinjau.</div>}<div className="admin-gallery-list">{filtered.map((item) => <article key={item.id}><img src={item.image_url} alt={item.title} /><div><strong>{item.title}</strong><small>{item.category}{item.event_date ? ` · ${item.event_date}` : ''}</small><p>{item.caption}</p></div><button className="icon-button" aria-label={`Ubah ${item.title}`} onClick={() => beginEdit(item)}><Settings2 size={17} /></button><button className="icon-danger" aria-label={`Hapus ${item.title}`} onClick={() => void remove(item)}><Trash2 size={17} /></button></article>)}</div>
    {formOpen && <GalleryForm editing={editing} form={form} setForm={setForm} files={files} setFiles={setFiles} busy={busy} onSave={save} onCancel={() => { setEditing(null); setFiles(null); setFormOpen(false) }} />}
  </div>
}

function GalleryForm({ editing, form, setForm, files, setFiles, busy, onSave, onCancel }: {
  editing: GalleryItem | null; form: { title: string; caption: string; category: string; event_date: string; sort_order: number }; setForm: (form: { title: string; caption: string; category: string; event_date: string; sort_order: number }) => void
  files: FileList | null; setFiles: (files: FileList | null) => void; busy: boolean; onSave: (event: FormEvent) => void; onCancel: () => void
}) {
  return <form className="inline-editor" onSubmit={onSave}><div className="editor-heading"><h3>{editing ? 'Edit foto' : 'Tambah foto'}</h3><button type="button" className="icon-button" onClick={onCancel} aria-label="Tutup"><X /></button></div><label>Judul foto<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Deskripsi / caption<textarea rows={2} value={form.caption} onChange={(event) => setForm({ ...form, caption: event.target.value })} /></label><div className="form-grid"><label>Kategori<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Tanggal kegiatan<input type="date" value={form.event_date} onChange={(event) => setForm({ ...form, event_date: event.target.value })} /></label><label>Urutan (angka lebih kecil tampil lebih dulu)<input type="number" min="0" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })} /></label></div><label className="file-picker"><Upload size={17} />{editing ? 'Ganti foto (opsional)' : 'Pilih satu atau beberapa foto'}<input type="file" multiple={!editing} accept="image/jpeg,image/png,image/webp" onChange={(event) => setFiles(event.target.files)} /></label>{files?.length ? <small>{files.length} foto dipilih</small> : null}<div className="form-actions"><button type="button" className="button button-outline-dark" onClick={onCancel}>Batal</button><button className="button button-purple" disabled={busy}>{busy ? 'Mengunggah...' : 'Simpan foto'}</button></div></form>
}

function EventManager({ onUpdated }: { onUpdated: () => void }) {
  const [items, setItems] = useState<EventItem[]>([])
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EventItem | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [photos, setPhotos] = useState<FileList | null>(null)
  const emptyForm = { title: '', description: '', location: '', category: categories[0], event_date: '' }
  const [form, setForm] = useState(emptyForm)
  useEffect(() => { void refresh() }, [])
  async function refresh() {
    if (!supabase) return
    const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true })
    if (error) setNotice(`Kegiatan gagal dimuat: ${error.message}`)
    else setItems((data ?? []) as EventItem[])
  }
  function begin(item?: EventItem) {
    setEditing(item ?? null); setFormOpen(true); setCover(null); setPhotos(null)
    setForm(item ? { title: item.title, description: item.description, location: item.location, category: item.category, event_date: item.event_date } : emptyForm)
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    if (!editing && !cover) { setNotice('Pilih foto sampul kegiatan.'); return }
    setBusy(true); setNotice('')
    try {
      if (cover) validateImage(cover)
      if (photos) Array.from(photos).forEach(validateImage)
      const cover_url = cover ? publicUrl(await uploadImage(cover)) : editing?.cover_url ?? ''
      const payload = { ...form, cover_url }
      const result = editing
        ? await supabase.from('events').update(payload).eq('id', editing.id).select().single()
        : await supabase.from('events').insert(payload).select().single()
      if (result.error) throw result.error
      const eventRow = result.data as EventItem
      const galleryPhotos = [...(cover ? [cover] : []), ...(photos ? Array.from(photos) : [])]
      if (galleryPhotos.length) {
        const rows = await Promise.all(galleryPhotos.map(async (file, index) => ({
          title: `${form.title}${galleryPhotos.length > 1 ? ` — ${index + 1}` : ''}`,
          caption: form.description, category: form.category, event_date: form.event_date || null,
          image_url: publicUrl(await uploadImage(file)), event_id: eventRow.id,
        })))
        const { error } = await supabase.from('gallery_items').insert(rows)
        if (error) throw error
      }
      await refresh(); onUpdated(); setNotice(editing ? 'Kegiatan berhasil diperbarui.' : 'Kegiatan dan dokumentasi berhasil disimpan.'); setFormOpen(false)
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Kegiatan gagal disimpan.') } finally { setBusy(false) }
  }
  async function remove(item: EventItem) {
    if (!supabase || !window.confirm(`Hapus kegiatan “${item.title}”? Dokumentasi galeri terkait tidak akan ikut dihapus.`)) return
    const { error } = await supabase.from('events').delete().eq('id', item.id)
    if (error) setNotice(`Kegiatan gagal dihapus: ${error.message}`)
    else { setItems((current) => current.filter((record) => record.id !== item.id)); onUpdated(); setNotice('Kegiatan berhasil dihapus.') }
  }
  return <div className="manager-content"><div className="editor-heading"><div><h2>Daftar kegiatan</h2><p>Kelola kegiatan yang akan datang maupun yang telah berlangsung.</p></div><button className="button button-purple" onClick={() => begin()}><Plus size={16} />Tambah Kegiatan</button></div>{notice && <p className="form-message" role="status">{notice}</p>}{!items.length && <div className="empty-state">Belum ada kegiatan. Tambahkan kegiatan pertama untuk ditampilkan ke pengunjung.</div>}<div className="event-manager-list">{items.map((item) => <article key={item.id}><img src={item.cover_url} alt={`Sampul ${item.title}`} /><div><span className="category-pill">{item.category}</span><h3>{item.title}</h3><p>{item.event_date} · {item.location}</p></div><button className="icon-button" aria-label={`Edit ${item.title}`} onClick={() => begin(item)}><Settings2 /></button><button className="icon-danger" aria-label={`Hapus ${item.title}`} onClick={() => void remove(item)}><Trash2 /></button></article>)}</div>{formOpen && <form className="inline-editor" onSubmit={(event) => void save(event)}><div className="editor-heading"><h3>{editing ? 'Edit kegiatan' : 'Kegiatan baru'}</h3><button type="button" className="icon-button" onClick={() => setFormOpen(false)} aria-label="Tutup"><X /></button></div><div className="form-grid"><label>Judul kegiatan<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Tanggal kegiatan<input type="date" required value={form.event_date} onChange={(event) => setForm({ ...form, event_date: event.target.value })} /></label><label>Lokasi<input required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label>Kategori<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div><label>Deskripsi<textarea rows={4} required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="file-picker"><Upload size={17} />{editing ? 'Ganti foto sampul (opsional)' : 'Pilih foto sampul'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCover(event.target.files?.[0] ?? null)} /></label><label className="file-picker"><Image size={17} />Foto dokumentasi tambahan (opsional)<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhotos(event.target.files)} /></label><small>Foto sampul dan dokumentasi juga ditampilkan di galeri.</small><div className="form-actions"><button type="button" className="button button-outline-dark" onClick={() => setFormOpen(false)}>Batal</button><button className="button button-purple" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan Kegiatan'}</button></div></form>}</div>
}

function validateImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error(`${file.name}: gunakan gambar JPG, PNG, atau WebP.`)
  if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name}: ukuran gambar maksimal 5 MB.`)
}

async function uploadImage(file: File) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  validateImage(file)
  const safeName = file.name.toLocaleLowerCase().replace(/[^a-z0-9.-]/g, '-')
  const path = `${crypto.randomUUID()}-${safeName}`
  const { error } = await supabase.storage.from('site-media').upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  return path
}

function publicUrl(path: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  return supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl
}

function storagePathFromUrl(url: string) {
  const marker = '/storage/v1/object/public/site-media/'
  const index = url.indexOf(marker)
  return index < 0 ? null : decodeURIComponent(url.slice(index + marker.length))
}
