import * as migration_20261008_155138_initial from './20261008_155138_initial'
import * as migration_20261008_173324_inquiry_ip_hash from './20261008_173324_inquiry_ip_hash'
import * as migration_20261008_183949_whatsapp_settings from './20261008_183949_whatsapp_settings'
import * as migration_20261009_060538_cms_editor_controls from './20261009_060538_cms_editor_controls'
import * as migration_20261009_135015_youtube_films from './20261009_135015_youtube_films'
import * as migration_20261009_150226_social_feedback from './20261009_150226_social_feedback'
import * as migration_20261009_222548_seo_city_pages from './20261009_222548_seo_city_pages'

export const migrations = [
  {
    up: migration_20261008_155138_initial.up,
    down: migration_20261008_155138_initial.down,
    name: '20261008_155138_initial',
  },
  {
    up: migration_20261008_173324_inquiry_ip_hash.up,
    down: migration_20261008_173324_inquiry_ip_hash.down,
    name: '20261008_173324_inquiry_ip_hash',
  },
  {
    up: migration_20261008_183949_whatsapp_settings.up,
    down: migration_20261008_183949_whatsapp_settings.down,
    name: '20261008_183949_whatsapp_settings',
  },
  {
    up: migration_20261009_060538_cms_editor_controls.up,
    down: migration_20261009_060538_cms_editor_controls.down,
    name: '20261009_060538_cms_editor_controls',
  },
  {
    up: migration_20261009_135015_youtube_films.up,
    down: migration_20261009_135015_youtube_films.down,
    name: '20261009_135015_youtube_films',
  },
  {
    up: migration_20261009_150226_social_feedback.up,
    down: migration_20261009_150226_social_feedback.down,
    name: '20261009_150226_social_feedback',
  },
  {
    up: migration_20261009_222548_seo_city_pages.up,
    down: migration_20261009_222548_seo_city_pages.down,
    name: '20261009_222548_seo_city_pages',
  },
]
