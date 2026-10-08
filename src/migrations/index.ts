import * as migration_20261008_155138_initial from './20261008_155138_initial';
import * as migration_20261008_173324_inquiry_ip_hash from './20261008_173324_inquiry_ip_hash';

export const migrations = [
  {
    up: migration_20261008_155138_initial.up,
    down: migration_20261008_155138_initial.down,
    name: '20261008_155138_initial',
  },
  {
    up: migration_20261008_173324_inquiry_ip_hash.up,
    down: migration_20261008_173324_inquiry_ip_hash.down,
    name: '20261008_173324_inquiry_ip_hash'
  },
];
