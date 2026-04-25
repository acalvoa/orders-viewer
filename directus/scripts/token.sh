#!/bin/sh
set -e

if [ -z "$ADMIN_STATIC_TOKEN" ]; then
  echo "ADMIN_STATIC_TOKEN not set, skipping."
  exit 0
fi

node --input-type=module << 'EOF'
const url      = process.env.DIRECTUS_URL    ?? 'http://127.0.0.1:8055';
const email    = process.env.ADMIN_EMAIL     ?? 'admin@example.com';
const password = process.env.ADMIN_PASSWORD  ?? 'admin';
const token    = process.env.ADMIN_STATIC_TOKEN;

const { data: { access_token } } = await fetch(`${url}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
}).then(r => r.json());

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${access_token}`,
};

const { data: me } = await fetch(`${url}/users/me?fields=token`, { headers }).then(r => r.json());

if (me.token === token) {
  console.log('Static token already configured.');
  process.exit(0);
}

await fetch(`${url}/users/me`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ token }),
});

console.log('Static token configured.');
EOF
