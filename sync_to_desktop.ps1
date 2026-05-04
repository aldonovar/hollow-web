$ErrorActionPreference = 'Stop'

Write-Host "Sincronizando archivos al repositorio desktop..."
$desktopPath = "C:\Users\Alexis\Documents\ALLYX\DevStreams\ESP"

$storageDir = "$desktopPath\services\storage"
$audioDir = "$desktopPath\services\audio"
$workletDir = "$desktopPath\public\worklets"

# Crear directorios si no existen
New-Item -ItemType Directory -Force -Path $storageDir | Out-Null
New-Item -ItemType Directory -Force -Path $audioDir | Out-Null
New-Item -ItemType Directory -Force -Path $workletDir | Out-Null

# Copiar archivos Storage (Dominio 5)
Copy-Item ".\src\daw\services\storage\localAudioCache.ts" -Destination $storageDir -Force
Copy-Item ".\src\daw\services\storage\cloudStorageService.ts" -Destination $storageDir -Force
Copy-Item ".\src\daw\services\storage\audioResourceManager.ts" -Destination $storageDir -Force
Copy-Item ".\src\daw\services\storage\flacWorker.ts" -Destination $storageDir -Force

# Ajustar import de Supabase para el entorno Desktop
$cloudServicePath = "$storageDir\cloudStorageService.ts"
(Get-Content $cloudServicePath) -replace "\.\./\.\./\.\./lib/supabase", "../supabase" | Set-Content $cloudServicePath

# Copiar archivos Audio (Dominio 6)
Copy-Item ".\src\daw\services\audio\audioEngineCore.ts" -Destination $audioDir -Force
Copy-Item ".\public\worklets\core-engine.worklet.js" -Destination $workletDir -Force

Write-Host "Instalando localforage en el repositorio desktop..."
Set-Location $desktopPath
npm install localforage

Write-Host "Haciendo commit y push en el repositorio desktop (Nube)..."
git add .
git commit -m "feat: implement isolated Web DSP architecture (AudioWorklet & SharedArrayBuffer) (Domain 6)"
git push origin main

Write-Host "Haciendo commit y push en el repositorio web (Nube)..."
Set-Location "c:\Users\Alexis\Documents\ALLYX\Proyectos Web\hollow-web"
git add .
git commit -m "feat: implement isolated Web DSP architecture (AudioWorklet & SharedArrayBuffer) (Domain 6)"
git push origin main

Write-Host "Completado exitosamente."
