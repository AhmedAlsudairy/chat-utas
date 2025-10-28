# Start React Frontend
Write-Host "🎨 Starting React Frontend..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure MCP Server is running on port 3001!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the dev server" -ForegroundColor Yellow
Write-Host ""

Set-Location vite-project
npm run dev
