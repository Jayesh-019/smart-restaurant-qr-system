Set-Location $PSScriptRoot
$env:PYTHONPATH = Join-Path $PSScriptRoot "backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
