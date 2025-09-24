@echo off
echo 🚀 Creating fast deployment package...

REM Stop any existing processes
echo 🔄 Stopping existing processes...
taskkill /f /im node.exe 2>nul

REM Build React app
echo 📦 Building React app...
cd client
call npm run build
if errorlevel 1 (
    echo ❌ React build failed
    pause
    exit /b 1
)
cd ..

echo ✅ React build completed

REM Create deployment directory
if exist deploy-package rmdir /s /q deploy-package
mkdir deploy-package
mkdir deploy-package\server
mkdir deploy-package\client\build

REM Copy server files
echo 📁 Copying server files...
xcopy server\* deploy-package\server\ /e /i /y
copy package.json deploy-package\
copy package-lock.json deploy-package\
copy startup.txt deploy-package\

REM Copy client build
echo 📁 Copying client build...
xcopy client\build\* deploy-package\client\build\ /e /i /y

REM Create web.config
echo 📁 Creating web.config...
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<handlers^>
echo       ^<add name="iisnode" path="server/index.js" verb="*" modules="iisnode"/^>
echo     ^</handlers^>
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true"^>
echo           ^<match url="^server/index.js\/debug[\/]?" /^>
echo         ^</rule^>
echo         ^<rule name="StaticContent"^>
echo           ^<action type="Rewrite" url="client/build{REQUEST_URI}"/^>
echo         ^</rule^>
echo         ^<rule name="DynamicContent"^>
echo           ^<conditions^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/^>
echo           ^</conditions^>
echo           ^<action type="Rewrite" url="server/index.js"/^>
echo         ^</rule^>
echo       ^</rules^>
echo     ^</rewrite^>
echo     ^<security^>
echo       ^<requestFiltering^>
echo         ^<hiddenSegments^>
echo           ^<remove segment="bin"/^>
echo         ^</hiddenSegments^>
echo       ^</requestFiltering^>
echo     ^</security^>
echo     ^<httpErrors existingResponse="PassThrough" /^>
echo     ^<iisnode watchedFiles="web.config;*.js"/^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > deploy-package\web.config

REM Create zip file
echo 📦 Creating deployment zip...
cd deploy-package
powershell Compress-Archive -Path * -DestinationPath ..\deployment.zip -Force
cd ..

REM Clean up
echo 🧹 Cleaning up...
rmdir /s /q deploy-package

echo.
echo 🎉 Deployment package ready!
echo 📦 File: deployment.zip
for %%A in (deployment.zip) do echo 📏 Size: %%~zA bytes
echo.
echo 🚀 To deploy to Azure:
echo 1. Go to Azure Portal ^> App Service ^> Deployment Center
echo 2. Choose "Zip Deploy"
echo 3. Upload deployment.zip
echo.
pause
