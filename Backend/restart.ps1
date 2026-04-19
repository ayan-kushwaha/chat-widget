# Auto-restart backend (kills all Node processes first)
Write-Host "🔄 Stopping all Node processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null

Start-Sleep -Seconds 2

Write-Host "🚀 Starting backend..." -ForegroundColor Green
npm run dev
