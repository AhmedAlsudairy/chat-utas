# Setup Script for RAG Chatbot
# Run this script from the project root: C:\Users\ZoomStore\Desktop\chatbot\sam

Write-Host "🚀 Setting up RAG Chatbot with MCP Server..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Install backend dependencies
Write-Host ""
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# Install frontend dependencies
Write-Host ""
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location chat-widget
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Set-Location ..

# Check for .env file
Write-Host ""
if (Test-Path .env) {
    Write-Host "✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found, creating from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "📝 Please edit .env and add your OpenAI API key!" -ForegroundColor Cyan
}

# Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ Setup Complete!                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Edit .env file and add your OpenAI API key:" -ForegroundColor White
Write-Host "   OPENAI_API_KEY=sk-your-key-here" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the MCP Server (Terminal 1):" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the React Frontend (Terminal 2):" -ForegroundColor White
Write-Host "   cd chat-widget" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "📚 Add TXT files to the 'doc' folder to get started!" -ForegroundColor Cyan
Write-Host ""
