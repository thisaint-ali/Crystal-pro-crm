$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
Set-Location "C:\Users\iokva\crystal-pro-crm"

$url = "https://wgittmnneqvzhkxchjre.supabase.co"
$anon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnaXR0bW5uZXF2emhreGNoanJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDkxMzAsImV4cCI6MjA5NDA4NTEzMH0.j3sP-rMmepkXvm4cIWMwWRgrqWCC1HFsovzeieIN0eY"
$service = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnaXR0bW5uZXF2emhreGNoanJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUwOTEzMCwiZXhwIjoyMDk0MDg1MTMwfQ.kISCHvG9SN1pHk45Rm9PWGVWWjzUcCo0EpTnapD97IA"

[System.IO.File]::WriteAllText("C:\Users\iokva\crystal-pro-crm\.env.vercel.url", $url, [System.Text.Encoding]::ASCII)
[System.IO.File]::WriteAllText("C:\Users\iokva\crystal-pro-crm\.env.vercel.anon", $anon, [System.Text.Encoding]::ASCII)
[System.IO.File]::WriteAllText("C:\Users\iokva\crystal-pro-crm\.env.vercel.service", $service, [System.Text.Encoding]::ASCII)

Get-Content "C:\Users\iokva\crystal-pro-crm\.env.vercel.url" -Raw | vercel env add NEXT_PUBLIC_SUPABASE_URL production --yes 2>&1
Get-Content "C:\Users\iokva\crystal-pro-crm\.env.vercel.anon" -Raw | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes 2>&1
Get-Content "C:\Users\iokva\crystal-pro-crm\.env.vercel.service" -Raw | vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes 2>&1

Remove-Item "C:\Users\iokva\crystal-pro-crm\.env.vercel.*" -ErrorAction SilentlyContinue
Write-Output "Done"
