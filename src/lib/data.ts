import { supabase } from './supabase'
import { defaultSettings, demoGallery, type EventItem, type GalleryItem, type SiteSettings } from '../types'

export async function loadPublicData() {
  if (!supabase) return { settings: defaultSettings, gallery: demoGallery, events: [] as EventItem[], sections: [] as Array<{ id: string; title: string; body: string }> }
  const [settingsResult, galleryResult, eventsResult, sectionsResult] = await Promise.all([
    supabase.from('site_settings').select('settings').eq('id', 1).maybeSingle(),
    supabase.from('gallery_items').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
    supabase.from('events').select('*').order('event_date', { ascending: true }),
    supabase.from('content_sections').select('id,title,body').order('sort_order'),
  ])
  if (settingsResult.error || galleryResult.error || eventsResult.error || sectionsResult.error) {
    throw settingsResult.error ?? galleryResult.error ?? eventsResult.error ?? sectionsResult.error
  }
  return {
    settings: { ...defaultSettings, ...(settingsResult.data?.settings ?? {}) } as SiteSettings,
    gallery: (galleryResult.data?.length ? galleryResult.data : demoGallery) as GalleryItem[],
    events: (eventsResult.data ?? []) as EventItem[],
    sections: sectionsResult.data ?? [],
  }
}
