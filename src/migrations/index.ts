import * as migration_20261008_155138_initial from './20261008_155138_initial';
import * as migration_20261008_173324_inquiry_ip_hash from './20261008_173324_inquiry_ip_hash';
import * as migration_20261008_183949_whatsapp_settings from './20261008_183949_whatsapp_settings';

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
    name: '20261008_183949_whatsapp_settings'
  },
];
