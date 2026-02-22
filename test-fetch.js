const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

fetch(`${url}/rest/v1/media_items?select=*&limit=1`, {
    headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
    }
})
    .then(async r => {
        console.log("Status:", r.status);
        console.log("Body:", await r.text());
    });
