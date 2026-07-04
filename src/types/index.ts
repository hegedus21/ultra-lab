export type Discipline = 'backyard_ultra' | 'trail_ultra' | 'road_ultra' | 'multi_day'
export type Level      = 'beginner' | 'advanced' | 'elite'
export type Status     = 'draft' | 'review' | 'published'
export type Lang       = 'hu' | 'en'

export interface Article {
  id: string
  slug: string
  title_hu: string | null
  title_en: string | null
  excerpt_hu: string | null
  excerpt_en: string | null
  content_hu: string | null
  content_en: string | null
  discipline: Discipline
  topics: string[]
  level: Level
  status: Status
  source_url: string | null
  source_type: 'youtube' | 'manual'
  runner_name: string | null
  cover_image: string | null
  created_at: string
  published_at: string | null
}

export interface Runner {
  id: string
  name: string
  country: string | null
  bio_hu: string | null
  bio_en: string | null
  achievements: string[]
  backyard_record: number | null
  photo: string | null
}

export interface Source {
  id: string
  name: string
  type: 'youtube_channel'
  url: string
  channel_id: string
  language: 'en' | 'ru' | 'hu'
  last_checked: string | null
  active: boolean
}

export interface PipelineItem {
  id: string
  source_id: string
  video_id: string
  video_title: string
  video_url: string
  transcript: string | null
  status: 'pending' | 'processing' | 'done' | 'error'
  created_at: string
}

export const TOPICS = [
  { key: 'backyard_ultra', label_hu: 'Backyard Ultra',      label_en: 'Backyard Ultra',     color: '#E05C22', num: '01' },
  { key: 'nutrition',      label_hu: 'Táplálkozás',         label_en: 'Nutrition',          color: '#2A5FA5', num: '02' },
  { key: 'training',       label_hu: 'Felkészülés',         label_en: 'Training',           color: '#2A7A4A', num: '03' },
  { key: 'mental',         label_hu: 'Mentális stratégia',  label_en: 'Mental strategy',    color: '#8B3EA8', num: '04' },
  { key: 'sleep',          label_hu: 'Alvásmenedzsment',    label_en: 'Sleep management',   color: '#C4362A', num: '05' },
  { key: 'gear',           label_hu: 'Felszerelés',         label_en: 'Gear',               color: '#1A6B6B', num: '06' },
  { key: 'race_strategy',  label_hu: 'Versenynapi taktika', label_en: 'Race day strategy',  color: '#7A6018', num: '07' },
  { key: 'recovery',       label_hu: 'Regeneráció',         label_en: 'Recovery',           color: '#445E3A', num: '08' },
] as const
