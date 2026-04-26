import { readFileSync } from 'fs';
import { DatabaseSync } from 'node:sqlite';

const dbPath = process.env.DB_FILENAME ?? '/directus/database/data.db';
const db = new DatabaseSync(dbPath);

const adminPolicy = db.prepare(
  'SELECT id FROM directus_policies WHERE admin_access = 1 LIMIT 1'
).get();

if (!adminPolicy) {
  console.log('No admin policy found, skipping permissions.');
  process.exit(0);
}

const permissions = JSON.parse(
  readFileSync('/directus/permissions/permissions.json', 'utf8')
);

for (const { collection, action } of permissions) {
  const exists = db.prepare(
    'SELECT id FROM directus_permissions WHERE policy = ? AND collection = ? AND action = ? LIMIT 1'
  ).get(adminPolicy.id, collection, action);

  if (!exists) {
    db.prepare(
      'INSERT INTO directus_permissions (policy, collection, action, fields) VALUES (?, ?, ?, ?)'
    ).run(adminPolicy.id, collection, action, JSON.stringify(['*']));
    console.log(`  ${collection} (${action}): created.`);
  } else {
    console.log(`  ${collection} (${action}): already exists.`);
  }
}
