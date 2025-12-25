# Supabase Deployment Script for Windows
# Run this script to deploy all migrations and edge functions

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "St. Joseph's Alumni Submission System" -ForegroundColor Cyan
Write-Host "Supabase Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed or use npx
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
$useNpx = $false
$cmdPrefix = "supabase"

if (-not $supabaseCmd) {
    # Check if npx is available
    $npxCmd = Get-Command npx -ErrorAction SilentlyContinue
    if ($npxCmd) {
        Write-Host "INFO: Using 'npx supabase' (CLI not installed locally)" -ForegroundColor Yellow
        $useNpx = $true
        $cmdPrefix = "npx supabase"
    } else {
        Write-Host "ERROR: Neither Supabase CLI nor npx is available" -ForegroundColor Red
        Write-Host "" 
        Write-Host "Install options for Windows:" -ForegroundColor Yellow
        Write-Host "  1. Scoop:       scoop bucket add supabase https://github.com/supabase/scoop-bucket.git" -ForegroundColor Cyan
        Write-Host "                  scoop install supabase" -ForegroundColor Cyan
        Write-Host "  2. Chocolatey:  choco install supabase" -ForegroundColor Cyan
        Write-Host "  3. NPX:         Requires Node.js (https://nodejs.org)" -ForegroundColor Cyan
        Write-Host "" 
        Write-Host "Or download binary: https://github.com/supabase/cli/releases" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "SUCCESS: Supabase CLI found" -ForegroundColor Green
}
Write-Host ""

# Navigate to workspace root for Supabase commands
$originalPath = Get-Location
Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "Working directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Step 1: Push database migrations
Write-Host "Deploying database migrations..." -ForegroundColor Cyan
if ($useNpx) {
    npx supabase db push
} else {
    supabase db push
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Migration deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Migrations deployed" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy Edge Functions
Write-Host "Deploying Edge Functions..." -ForegroundColor Cyan

Write-Host "  -> Deploying submit-alumni-memory..." -ForegroundColor Yellow
if ($useNpx) {
    npx supabase functions deploy submit-alumni-memory --no-verify-jwt
} else {
    supabase functions deploy submit-alumni-memory --no-verify-jwt
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Function deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "  -> Deploying get-media-signed-url..." -ForegroundColor Yellow
if ($useNpx) {
    npx supabase functions deploy get-media-signed-url
} else {
    supabase functions deploy get-media-signed-url
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Function deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Edge Functions deployed" -ForegroundColor Green
Write-Host ""

# Step 3: Set secrets reminder
Write-Host "Checking secrets..." -ForegroundColor Cyan
Write-Host "WARNING: Make sure SUPABASE_SERVICE_ROLE_KEY is set:" -ForegroundColor Yellow
Write-Host ("    " + $cmdPrefix + " secrets set SUPABASE_SERVICE_ROLE_KEY=your-key") -ForegroundColor Yellow
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SUCCESS: Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify buckets in Supabase Dashboard > Storage"
Write-Host "2. Create admin user with role='admin' in user_metadata"
Write-Host "3. Test submission with cURL or Postman"
Write-Host ""
Write-Host "View function logs:" -ForegroundColor Cyan
Write-Host ("  " + $cmdPrefix + " functions logs submit-alumni-memory") -ForegroundColor White
Write-Host ""
