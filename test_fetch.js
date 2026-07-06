fetch("https://jxgpjqvizffplycfptux.supabase.co/rest/v1/users?id=eq.1&select=id,name,phone,telegram_id", {
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4Z3BqcXZpemZmcGx5Y2ZwdHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MzcxNDgsImV4cCI6MjA5ODMxMzE0OH0.n6KqrdjZv8HEtKIN788ldijADFKCevvis-ypeWBybzc",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4Z3BqcXZpemZmcGx5Y2ZwdHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MzcxNDgsImV4cCI6MjA5ODMxMzE0OH0.n6KqrdjZv8HEtKIN788ldijADFKCevvis-ypeWBybzc"
  }
}).then(r => r.json()).then(console.log).catch(console.error);
