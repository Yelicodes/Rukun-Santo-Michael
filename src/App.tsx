import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Church,
  Cross, Facebook, Heart, Instagram, MapPin, Menu, Shield, Sparkles, X,
} from 'lucide-react'
import { loadPublicData } from './lib/data'
import { categories, defaultSettings, type EventItem, type GalleryItem, type SiteSettings } from './types'
import Admin from './components/Admin'

type PublicData = { settings: SiteSettings; gallery: GalleryItem[]; events: EventItem[]; sections: Array<{ id: string; title: string; body: string }> }

function App() {
  const [data, setData] = useState<PublicData>({ settings: defaultSettings, gallery: [], events: [], sections: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [photo, setPhoto] = useState<GalleryItem | null>(null)
  const location = useLocation()

  const refresh = useCallback(async () => {
    try {
      const fresh = await loadPublicData()
      setData(fresh)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Konten gagal dimuat.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh, location.pathname])
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', data.settings.theme_color || defaultSettings.theme_color)
  }, [data.settings.theme_color])
  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0) }, [location.pathname])

  const nav = [
    ['Beranda', '/'],
    ['Tentang Kami', '/tentang'],
    ['Kegiatan', '/kegiatan'],
    ['Galeri', '/galeri'],
    ['Kontak', '/kontak'],
  ]
  const social = (className = '') => (
    <div className={`social-links ${className}`}>
      {data.settings.facebook_url && <a href={data.settings.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={18} /></a>}
      {data.settings.instagram_url && <a href={data.settings.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>}
    </div>
  )

  return (
    <div className="site-shell">
      <header className="navbar">
        <Link to="/" className="brand" aria-label="Rukun Santo Michael, beranda">
          <Emblem image={data.settings.logo_url} size={42} animate={false} />
          <span><strong>RUKUN SANTO MICHAEL</strong><small>WOWONDA · INDONESIA</small></span>
        </Link>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'} aria-label="Navigasi utama">
          {nav.map(([label, href]) => <NavLink key={href} to={href} end={href === '/'}>{label}</NavLink>)}
          {social('nav-social')}
        </nav>
        <Link className="nav-admin" to="/admin"><Shield size={15} /> Pengurus</Link>
        <button className="menu-toggle" aria-label="Buka navigasi" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      {error && <div className="site-alert" role="status">Konten belum dapat diperbarui: {error} <button onClick={() => void refresh()}>Coba lagi</button></div>}
      <main>
        {loading ? <div className="loading-state"><span className="spinner" />Memuat ruang kebersamaan...</div> : (
          <Routes>
            <Route path="/" element={<Home data={data} onPhoto={setPhoto} />} />
            <Route path="/tentang" element={<About data={data} onPhoto={setPhoto} />} />
            <Route path="/kegiatan" element={<Activities events={data.events} />} />
            <Route path="/galeri" element={<Gallery items={data.gallery} onPhoto={setPhoto} />} />
            <Route path="/kontak" element={<Contact settings={data.settings} social={social} />} />
            <Route path="/admin" element={<Admin onUpdated={refresh} />} />
            <Route path="*" element={<Home data={data} onPhoto={setPhoto} />} />
          </Routes>
        )}
      </main>
      <Footer settings={data.settings} nav={nav} social={social} />
      <AnimatePresence>{photo && <Lightbox item={photo} onClose={() => setPhoto(null)} />}</AnimatePresence>
    </div>
  )
}

function Emblem({ image, size = 180, animate = true }: { image?: string; size?: number; animate?: boolean }) {
  return (
    <motion.div className={`emblem ${animate ? 'emblem-animated' : ''}`} style={{ width: size, height: size }} initial={animate ? { opacity: 0, scale: .88, y: 12 } : false} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .8, ease: 'easeOut' }}>
      {image ? <img src={image} alt="Logo Rukun Santo Michael" /> : (
        <svg viewBox="0 0 220 220" role="img" aria-label="Lambang artistik Rukun Santo Michael">
          <defs>
            <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe8a8" /><stop offset=".52" stopColor="#c6923a" /><stop offset="1" stopColor="#fff0c5" /></linearGradient>
            <linearGradient id="robe" x1="0" x2="1" y2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#c8b9e7" /></linearGradient>
            <linearGradient id="wing" x1="0" x2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#a7c9ee" /></linearGradient>
          </defs>
          <circle cx="110" cy="110" r="103" fill="#24123c" stroke="url(#ring)" strokeWidth="3" />
          <circle cx="110" cy="110" r="91" fill="none" stroke="#d8bd77" strokeOpacity=".55" />
          <path d="M91 88C69 56 39 47 26 55c22 7 24 27 27 42-12-9-24-10-31-8 19 9 23 24 38 39 8 9 19 14 31 16z" fill="url(#wing)" stroke="#fff" strokeWidth="2" />
          <path d="M129 88c22-32 52-41 65-33-22 7-24 27-27 42 12-9 24-10 31-8-19 9-23 24-38 39-8 9-19 14-31 16z" fill="url(#wing)" stroke="#fff" strokeWidth="2" />
          <circle cx="110" cy="65" r="16" fill="#f4d7ba" />
          <path d="M93 84l17-8 17 8 9 44-26 27-26-27z" fill="url(#robe)" stroke="#e8d7af" strokeWidth="2" />
          <path d="M91 91l19 13 19-13-5 28h-28z" fill="#7653a4" />
          <path d="M105 97l18-17 3 3-14 24-5-3-6 28-4-1 4-31z" fill="#e7c36a" stroke="#fff1bc" strokeWidth="1.5" />
          <path d="M97 149l-7 15m31-15 8 15" stroke="#d9c58f" strokeWidth="5" strokeLinecap="round" />
          <path d="M71 177h78" stroke="url(#ring)" strokeWidth="2" />
          <text x="110" y="190" textAnchor="middle" fill="#fff0c5" fontSize="9" fontFamily="sans-serif" letterSpacing="1.4">SANCTE MICHAEL</text>
        </svg>
      )}
      <span className="emblem-glow" />
    </motion.div>
  )
}

function Home({ data, onPhoto }: { data: PublicData; onPhoto: (item: GalleryItem) => void }) {
  const photos = data.gallery.slice(0, 6)
  return (
    <>
      <section className="hero">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <div className="hero-grain" />
        <div className="hero-content">
          <motion.div className="eyebrow light" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><span /> KOMUNITAS IMAN · WOWONDA</motion.div>
          <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12, duration: .7 }}>{data.settings.organization_name}</motion.h1>
          <motion.p className="hero-tagline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 }}>{data.settings.tagline}</motion.p>
          <p className="hero-location"><MapPin size={16} /> {data.settings.location}</p>
          <div className="hero-actions">
            <Link to="/tentang" className="button button-gold">Kenali Kami <ArrowRight size={16} /></Link>
            <Link to="/kegiatan" className="button button-glass">Lihat Kegiatan <ArrowUpRight size={16} /></Link>
          </div>
        </div>
        <div className="hero-emblem"><Emblem image={data.settings.logo_url} size={data.settings.logo_size} animate={data.settings.logo_animation} /></div>
        <a href="#sambutan" className="scroll-cue"><ArrowDown size={15} /> GULIR UNTUK MENGENAL</a>
        <div className="hero-bottom" />
      </section>
      <section className="welcome section-wrap" id="sambutan">
        <div className="welcome-mark"><Cross size={27} /><span>✦</span></div>
        <div className="welcome-copy"><div className="eyebrow">SALAM PERSAUDARAAN</div><h2>{data.settings.welcome_title}</h2><p>{data.settings.welcome_text}</p><Link className="text-link" to="/tentang">Lebih jauh tentang kami <ArrowRight size={16} /></Link></div>
        <aside className="welcome-note"><span className="quote-mark">“</span><p>Di bawah perlindungan Santo Michael, kita melangkah bersama dengan iman, harapan, dan kasih.</p><small>— RUKUN SANTO MICHAEL</small></aside>
      </section>
      <section className="identity-band">
        <div className="identity-inner">
          <div className="identity-intro"><div className="eyebrow light">HIDUP DALAM KASIH</div><h2>Iman yang bertumbuh.<br /><em>Kasih yang mengalir.</em></h2><p>Ruang untuk berjumpa, bertumbuh dalam iman, dan hadir melayani sesama.</p><Link to="/tentang" className="button button-outline">Kenali rukun kami <ArrowRight size={16} /></Link></div>
          <div className="identity-values"><Value icon={<Church />} number="01" title="Bertumbuh dalam iman" /><Value icon={<Heart />} number="02" title="Menjalin persaudaraan" /><Value icon={<Sparkles />} number="03" title="Melayani dengan kasih" /></div>
        </div>
      </section>
      <section className="section-wrap recent-section">
        <div className="section-heading"><div><div className="eyebrow">CERITA KEBERSAMAAN</div><h2>Potret perjalanan kami</h2><p>Momen iman, pelayanan, dan persaudaraan yang tumbuh bersama.</p></div><Link to="/galeri" className="text-link">Jelajahi galeri <ArrowRight size={16} /></Link></div>
        <PhotoGrid items={photos} onPhoto={onPhoto} />
        {!photos.length && <p className="empty-state">Belum ada foto. Dokumentasi kegiatan akan tampil di sini.</p>}
        <p className="demo-note">Foto yang ditandai sebagai contoh bukan dokumentasi resmi rukun.</p>
      </section>
      <section className="home-cta"><div><div className="eyebrow light">MARI MELANGKAH BERSAMA</div><h2>Temukan tempatmu<br />dalam persaudaraan.</h2><p>Kenali lebih dekat Rukun Santo Michael dan perjalanan kami.</p><Link to="/kontak" className="button button-gold">Hubungi kami <ArrowRight size={16} /></Link></div><div className="cta-cross"><Cross size={110} strokeWidth={.7} /></div></section>
    </>
  )
}

function Value({ icon, number, title }: { icon: React.ReactNode; number: string; title: string }) {
  return <div className="value-item"><div className="value-icon">{icon}</div><div><small>{number} / NILAI KAMI</small><h3>{title}</h3></div></div>
}

function PageIntro({ label, title, description }: { label: string; title: string; description: string }) {
  return <div className="page-intro"><div className="eyebrow light">{label}</div><h1>{title}</h1><p>{description}</p><span className="intro-decoration">✦</span></div>
}

function About({ data, onPhoto }: { data: PublicData; onPhoto: (item: GalleryItem) => void }) {
  const { settings } = data
  return (
    <>
      <PageIntro label="MENGENAL KAMI" title="Tentang Rukun Santo Michael" description="Sebuah ruang untuk bertumbuh dalam iman, persaudaraan, dan pelayanan kasih." />
      <section className="section-wrap about-content">
        <div className="about-top"><div className="about-emblem"><Emblem image={settings.logo_url} size={185} animate={false} /></div><div><div className="eyebrow">PROFIL RUKUN</div><h2>Berjalan bersama<br />dalam satu iman.</h2><p>{settings.history}</p><p className="location-line"><MapPin size={17} /> {settings.location}</p></div></div>
        <div className="about-cards"><article><span className="card-number">01</span><h3>Visi</h3><p>{settings.vision}</p></article><article><span className="card-number">02</span><h3>Misi</h3><p>{settings.mission}</p></article><article><span className="card-number">03</span><h3>Nilai persaudaraan</h3><p>Iman yang teguh, saling menghormati, kebersamaan dalam suka dan duka, serta pelayanan yang dilakukan dengan tulus.</p></article></div>
        {data.sections.length > 0 && <div className="custom-about-sections">{data.sections.map((section) => <article key={section.id}><div className="eyebrow">CERITA KAMI</div><h2>{section.title}</h2><p>{section.body}</p></article>)}</div>}
      </section>
      <section className="about-gallery"><div className="section-wrap"><div className="section-heading"><div><div className="eyebrow">BERSAMA DALAM PERJALANAN</div><h2>Momen kebersamaan</h2></div><Link to="/galeri" className="text-link">Lihat galeri <ArrowRight size={16} /></Link></div><PhotoGrid items={data.gallery.slice(0, 3)} onPhoto={onPhoto} /></div></section>
      <section className="draft-disclaimer"><Shield size={17} /> Teks yang diawali “[DRAF]” merupakan konten contoh dan perlu dilengkapi pengurus.</section>
    </>
  )
}

function Activities({ events }: { events: EventItem[] }) {
  const upcoming = events.filter((event) => new Date(`${event.event_date}T23:59:59`) >= new Date())
  const past = events.filter((event) => !upcoming.includes(event))
  return (
    <>
      <PageIntro label="HIDUP DALAM PERSAUDARAAN" title="Kegiatan Rukun" description="Setiap perjumpaan menjadi kesempatan untuk bertumbuh, berbagi, dan melayani." />
      <section className="section-wrap activities-content">
        {!events.length ? <div className="empty-panel"><CalendarDays size={30} /><h2>Belum ada kegiatan</h2><p>Informasi kegiatan akan tampil di sini setelah ditambahkan oleh pengurus.</p></div> : <>
          {upcoming.length > 0 && <EventGroup title="Akan datang" events={upcoming} />}
          {past.length > 0 && <EventGroup title="Telah berlangsung" events={past} />}
        </>}
      </section>
    </>
  )
}

function EventGroup({ title, events }: { title: string; events: EventItem[] }) {
  return <div className="event-group"><div className="eyebrow">{title}</div><div className="event-grid">{events.map((event) => <article key={event.id} className="event-card">{event.cover_url ? <img src={event.cover_url} alt={`Foto sampul ${event.title}`} /> : <div className="event-placeholder"><Cross /></div>}<div className="event-body"><span className="category-pill">{event.category}</span><h3>{event.title}</h3><p>{event.description}</p><small><CalendarDays size={14} /> {new Date(`${event.event_date}T00:00:00`).toLocaleDateString('id-ID', { dateStyle: 'long' })}</small><small><MapPin size={14} /> {event.location}</small></div></article>)}</div></div>
}

function PhotoGrid({ items, onPhoto }: { items: GalleryItem[]; onPhoto: (item: GalleryItem) => void }) {
  return <div className="photo-grid">{items.map((item, index) => <button className={`photo-card photo-${index % 6}`} key={item.id} onClick={() => onPhoto(item)} aria-label={`Buka foto: ${item.title}`}><img src={item.image_url} alt={item.title} loading="lazy" /><span className="photo-overlay"><small>{item.category}</small><strong>{item.title}</strong>{item.is_sample && <em>FOTO CONTOH</em>}</span></button>)}</div>
}

function Gallery({ items, onPhoto }: { items: GalleryItem[]; onPhoto: (item: GalleryItem) => void }) {
  const [category, setCategory] = useState('Semua')
  const [query, setQuery] = useState('')
  const filtered = items.filter((item) => (category === 'Semua' || item.category === category) && item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  return (
    <>
      <PageIntro label="DOKUMENTASI" title="Galeri Kegiatan" description="Merawat kenangan dari setiap langkah iman, kebersamaan, dan pelayanan." />
      <section className="section-wrap gallery-content">
        <div className="gallery-controls"><div className="filter-list">{['Semua', ...categories].map((item) => <button key={item} className={category === item ? 'filter-chip selected' : 'filter-chip'} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><span className="sr-only">Cari foto</span><input placeholder="Cari foto..." value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
        {filtered.length ? <PhotoGrid items={filtered} onPhoto={onPhoto} /> : <div className="empty-state">Belum ada foto pada kategori ini.</div>}
        {items.some((item) => item.is_sample) && <p className="demo-note">Foto contoh dari Unsplash hanya untuk pratinjau desain, bukan dokumentasi resmi Rukun Santo Michael. Pengurus dapat menggantinya melalui halaman Pengurus.</p>}
      </section>
    </>
  )
}

function Contact({ settings, social }: { settings: SiteSettings; social: (className?: string) => React.ReactNode }) {
  const query = encodeURIComponent(settings.map_query || settings.location)
  return (
    <>
      <PageIntro label="KAMI SIAP MENYAPA" title="Kontak dan Lokasi" description="Mari menjalin perjumpaan dan bertumbuh bersama dalam persaudaraan." />
      <section className="section-wrap contact-content">
        <div className="contact-card"><div className="contact-icon"><MapPin /></div><div className="eyebrow">KUNJUNGI KAMI</div><h2>Rukun Santo Michael</h2><p>{settings.location}</p><a className="button button-purple" href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noreferrer">Buka di Google Maps <ArrowUpRight size={16} /></a></div>
        <div className="contact-card"><div className="contact-icon"><Heart /></div><div className="eyebrow">TERHUBUNG</div><h2>Mari bertegur sapa.</h2>{settings.contact_email && <p><a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></p>}{settings.contact_phone && <p><a href={`tel:${settings.contact_phone}`}>{settings.contact_phone}</a></p>}{social('contact-social')}{!settings.contact_email && !settings.contact_phone && !settings.facebook_url && !settings.instagram_url && <p>Informasi kontak dan media sosial belum ditambahkan oleh pengurus.</p>}</div>
      </section>
    </>
  )
}

function Footer({ settings, nav, social }: { settings: SiteSettings; nav: string[][]; social: (className?: string) => React.ReactNode }) {
  return <footer className="footer"><div className="footer-main"><div className="footer-brand"><Link to="/" className="brand"><Emblem image={settings.logo_url} size={48} animate={false} /><span><strong>{settings.organization_name}</strong><small>BERSATU DALAM IMAN</small></span></Link><p>Dalam iman, persaudaraan, dan pelayanan kasih.</p>{social('footer-social')}</div><div><h3>Jelajahi</h3>{nav.map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}</div><div className="footer-location"><h3>Temukan kami</h3><p><MapPin size={15} />{settings.location}</p></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.organization_name}. Dengan kasih dan pelayanan.</span><Link to="/admin">Ruang pengurus <ArrowUpRight size={13} /></Link></div></footer>
}

function Lightbox({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])
  return <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><button className="lightbox-close" aria-label="Tutup foto"><X /></button><motion.figure initial={{ scale: .95 }} animate={{ scale: 1 }} onClick={(event) => event.stopPropagation()}><img src={item.image_url} alt={item.title} /><figcaption><strong>{item.title}</strong><span>{item.caption}</span><small>{item.category}{item.event_date ? ` · ${new Date(`${item.event_date}T00:00:00`).toLocaleDateString('id-ID')}` : ''}</small></figcaption></motion.figure></motion.div>
}

export default App
