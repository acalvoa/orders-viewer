#!/usr/bin/env node

import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    url:       { type: 'string', default: 'http://localhost:8055' },
    token:     { type: 'string', default: 'super-token-dev' },
    count:     { type: 'string', default: '10' },
    conflicts: { type: 'string', default: '0' },
  },
});

const BASE_URL  = values.url;
const TOKEN     = values.token;
const COUNT     = parseInt(values.count);
const CONFLICTS = parseInt(values.conflicts);

if (CONFLICTS > COUNT) {
  console.error(`Error: --conflicts (${CONFLICTS}) cannot exceed --count (${COUNT})`);
  process.exit(1);
}

const PRODUCTS = [
  'Gear Assembly A1', 'Valve Block B2',   'Hydraulic Pump C3',
  'Control Panel D4', 'Motor Housing E5', 'Bearing Kit F6',
  'Piston Rod G7',    'Cylinder Head H8', 'Cooling Unit I9',
  'Sensor Array J10',
];

const STATUSES = ['planned', 'scheduled', 'in_progress', 'completed'];

const randomInt  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const addDays    = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
const randomRef  = () => `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

function toDateTimeStr(date) {
  const pad = (n) => String(n).padStart(2, '0');
  // Random working hour (6–22) with minutes rounded to :00 or :30
  const hour   = randomInt(6, 21);
  const minute = Math.random() < 0.5 ? 0 : 30;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(minute)}:00`;
}

function buildOrder({ product, startDate, endDate } = {}) {
  const start = startDate ?? addDays(new Date(), randomInt(0, 90));
  const end   = endDate   ?? addDays(start, randomInt(3, 21));
  return {
    reference: randomRef(),
    product:   product ?? randomItem(PRODUCTS),
    quantity:  randomInt(10, 500),
    startDate: toDateTimeStr(start),
    endDate:   toDateTimeStr(end),
    status:    randomItem(STATUSES),
  };
}

async function post(order) {
  const res = await fetch(`${BASE_URL}/items/production_orders`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body:    JSON.stringify(order),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  const baseCount = COUNT - CONFLICTS;
  const orders    = [];

  // Regular orders
  for (let i = 0; i < baseCount; i++) {
    orders.push(buildOrder());
  }

  // Conflicting orders: same product, dates overlap with a random base order by 1+ day
  for (let i = 0; i < CONFLICTS; i++) {
    const base          = orders[randomInt(0, baseCount - 1)];
    const baseEnd       = new Date(base.endDate);
    const conflictStart = addDays(baseEnd, -randomInt(1, 3));   // starts before base ends
    const conflictEnd   = addDays(conflictStart, randomInt(3, 10));
    orders.push(buildOrder({ product: base.product, startDate: conflictStart, endDate: conflictEnd }));
  }

  // Shuffle so conflicting orders are spread throughout
  orders.sort(() => Math.random() - 0.5);

  console.log(`Seeding ${COUNT} orders (${CONFLICTS} with conflicts) → ${BASE_URL}`);

  let created = 0;
  let failed  = 0;

  for (const order of orders) {
    try {
      await post(order);
      created++;
      process.stdout.write(`\r  ${created}/${orders.length}`);
    } catch (err) {
      failed++;
      console.error(`\n  Failed: ${err.message}`);
    }
  }

  console.log(`\nDone: ${created} created, ${failed} failed.`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
