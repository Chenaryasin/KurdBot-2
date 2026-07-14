const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1].trim();
const { createClient } = require('./node_modules/@supabase/supabase-js');
const supabase = createClient(url, key);

function normalizeText(text) {
  if (!text) return text;
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  let result = text.trim().replace(/\s+/g, '');
  for (let i = 0; i < 10; i++) {
    result = result.split(arabicNumbers[i]).join(i.toString())
                   .split(persianNumbers[i]).join(i.toString());
  }
  
  if (result.startsWith("0")) {
    result = "+964" + result.substring(1);
  } else if (result.startsWith("964")) {
    result = "+" + result;
  } else if (!result.startsWith("+")) {
    result = "+964" + result;
  }
  
  return result;
}

async function main() {
  const { data: profs, error: profsError } = await supabase
    .from('professionals')
    .select('id, name, phone, user_id, telegram_id');
    
  if (profsError) {
    console.error("Profs fetch error:", profsError);
    return;
  }
  
  console.log(`Found ${profs.length} professionals total.`);
  
  let updatedCount = 0;
  
  for (const prof of profs) {
    if (prof.user_id) {
      console.log(`Professional ${prof.name} already linked to user_id ${prof.user_id}`);
      continue;
    }
    
    const normalizedPhone = normalizeText(prof.phone);
    console.log(`Searching user for ${prof.name} with normalized phone ${normalizedPhone}...`);
    
    // Search users by normalized phone
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, telegram_id')
      .eq('phone', normalizedPhone)
      .maybeSingle();
      
    if (user) {
      console.log(`MATCH found! Linking ${prof.name} to user_id: ${user.id}, telegram_id: ${user.telegram_id}`);
      const { error: updateError } = await supabase
        .from('professionals')
        .update({
          user_id: user.id,
          telegram_id: user.telegram_id
        })
        .eq('id', prof.id);
        
      if (updateError) {
        console.error(`Update error for ${prof.name}:`, updateError);
      } else {
        updatedCount++;
      }
    } else {
      console.log(`No match for ${prof.name} (${prof.phone} -> ${normalizedPhone})`);
    }
  }
  
  console.log(`Finished. Linked ${updatedCount} professionals to users.`);
}

main();
