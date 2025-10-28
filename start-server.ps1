# Start MCP Server
Write-Host "🚀 Starting MCP RAG Server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Check if .env exists and has API key
if (Test-Path .env) {
    $envContent = Get-Content .env -Raw
    if ($envContent -match "OPENAI_API_KEY=sk-") {
        npm start
    } else {
        Write-Host "❌ Error: Please add your OpenAI API key to .env file" -ForegroundColor Red
        Write-Host "   Edit .env and set: OPENAI_API_KEY=sk-your-key-here" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "   Run setup.ps1 first" -ForegroundColor Yellow
    exit 1
}
