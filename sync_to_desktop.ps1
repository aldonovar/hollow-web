$ErrorActionPreference = 'Stop'

Write-Host "Sincronizando archivos al repositorio desktop..."
$desktopPath = "C:\Users\Alexis\Documents\ALLYX\DevStreams\ESP"
$storageDir = "$desktopPath\services\storage"

# Crear directorio si no existe
New-Item -ItemType Directory -Force -Path $storageDir | Out-Null

# Copiar archivos
Copy-Item ".\src\daw\services\storage\localAudioCache.ts" -Destination $storageDir -Force
Copy-Item ".\src\daw\services\storage\cloudStorageService.ts" -Destination $storageDir -Force
Copy-Item ".\src\daw\services\storage\audioResourceManager.ts" -Destination $storageDir -Force
Copy-Item ".\src\daw\services\storage\flacWorker.ts" -Destination $storageDir -Force

Write-Host "Instalando localforage en el repositorio desktop..."
Set-Location $desktopPath
npm install localforage

Write-Host "Haciendo commit y push en el repositorio desktop (Nube)..."
git add .
git commit -m "feat: implement hybrid OPFS/IDB storage cache and Supabase cloud sync proxy (Domain 5)"
git push origin main

Write-Host "Haciendo commit y push en el repositorio web (Nube)..."
Set-Location "c:\Users\Alexis\Documents\ALLYX\Proyectos Web\hollow-web"
git add .
git commit -m "feat: implement hybrid OPFS/IDB storage cache and Supabase cloud sync proxy (Domain 5)"
git push origin main

Write-Host "Completado exitosamente."
