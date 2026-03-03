import Dexie from 'dexie';

const db = new Dexie('AutobatOffline');

db.version(1).stores({
  badgeages_pending: '++local_id, chantier_id, type, timestamp'
});

export default db;
