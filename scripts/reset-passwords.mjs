import https from 'https';
import bcrypt from 'bcryptjs';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
  console.error('Missing env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

const agent = new https.Agent({ rejectUnauthorized: false });

async function d1Query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ sql, params });
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      agent,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const d = JSON.parse(data);
        if (!d.success) reject(new Error(d.errors?.[0]?.message || 'D1 error'));
        else resolve(d.result?.[0]?.results || []);
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const users = await d1Query('SELECT id, email, role FROM users');
  console.log(`Found ${users.length} users`);

  for (const user of users) {
    const plain = user.role === 'ADMIN' ? 'Admin@123' : 'Pass@123';
    const hash = await bcrypt.hash(plain, 10);
    await d1Query('UPDATE users SET password = ? WHERE id = ?', [hash, user.id]);
    console.log(`✅ Reset password for ${user.email} → ${plain}`);
  }

  console.log('\n✅ All passwords reset. Log in with:');
  console.log('  Admin users  → Admin@123');
  console.log('  Other users  → Pass@123');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
