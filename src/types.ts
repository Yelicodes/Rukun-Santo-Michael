export type SiteSettings = {
  organization_name: string
  tagline: string
  location: string
  welcome_title: string
  welcome_text: string
  history: string
  vision: string
  mission: string
  theme_color: string
  logo_url: string
  logo_size: number
  logo_animation: boolean
  facebook_url: string
  instagram_url: string
  contact_email: string
  contact_phone: string
  map_query: string
}

export type GalleryItem = {
  id: string
  title: string
  caption: string
  category: string
  event_date: string | null
  image_url: string
  sort_order?: number
  is_sample?: boolean
  created_at?: string
}

export type EventItem = {
  id: string
  title: string
  description: string
  location: string
  category: string
  event_date: string
  cover_url: string
  created_at?: string
}

export const defaultSettings: SiteSettings = {
  organization_name: 'RUKUN SANTO MICHAEL',
  tagline: 'Bersatu dalam Iman, Bertumbuh dalam Persaudaraan, Melayani dalam Kasih',
  location: 'Stasi Sta. Maria Immaculata Wowonda, Paroki Sta. Maria Immaculata Wowonda',
  welcome_title: 'Bertumbuh bersama dalam iman dan kasih',
  welcome_text: 'Selamat datang di ruang digital Rukun Santo Michael. Mari berjalan bersama dalam iman, saling menguatkan dalam persaudaraan, dan menghadirkan kasih melalui pelayanan.',
  history: '[DRAF — lengkapi dengan sejarah resmi Rukun Santo Michael melalui halaman admin.]',
  vision: '[DRAF — silakan isi visi resmi rukun melalui halaman admin.]',
  mission: '[DRAF — silakan isi misi resmi rukun melalui halaman admin.]',
  theme_color: '#6c42a0',
  logo_url: '',
  logo_size: 220,
  logo_animation: true,
  facebook_url: '',
  instagram_url: '',
  contact_email: '',
  contact_phone: '',
  map_query: 'Stasi Sta. Maria Immaculata Wowonda',
}

const samplePhotos = [
  ['Doa bersama dalam kebersamaan', 'Kegiatan Rohani', 'photo-1511632765486-a01980e01a18'],
  ['Melayani dengan sukacita', 'Kegiatan Sosial', 'photo-1559027615-cd4628902d4a'],
  ['Kebersamaan komunitas', 'Kebersamaan Anggota', 'photo-1529156069898-49953e39b3ac'],
  ['Suasana perayaan iman', 'Perayaan Ekaristi', 'photo-1519682337058-a94d519337bc'],
  ['Berbagi kasih kepada sesama', 'Kegiatan Sosial', 'photo-1469571486292-0ba58a3f068b'],
  ['Bersama dalam pelayanan', 'Kebersamaan Anggota', 'photo-1517486808906-6ca8b3f04846'],
  ['Momen penuh syukur', 'Perayaan Hari Raya', 'photo-1507692049790-de58290a4334'],
  ['Semangat melayani', 'Kegiatan Rohani', 'photo-1531206715517-5c0ba140b2b8'],
  ['Sukacita dalam persaudaraan', 'Kebersamaan Anggota', 'photo-1511632765486-a01980e01a18'],
  ['Bersama membangun harapan', 'Kegiatan Lainnya', 'photo-1527529482837-4698179dc6ce'],
]

export const demoGallery: GalleryItem[] = samplePhotos.map(([title, category, photo], index) => ({
  id: `sample-${index + 1}`,
  title,
  category,
  caption: 'Foto contoh — bukan dokumentasi resmi Rukun Santo Michael. Ganti melalui halaman admin.',
  event_date: null,
  image_url: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=80`,
  is_sample: true,
}))

export const categories = ['Kegiatan Rohani', 'Perayaan Ekaristi', 'Kegiatan Sosial', 'Kebersamaan Anggota', 'Perayaan Hari Raya', 'Kegiatan Lainnya']
