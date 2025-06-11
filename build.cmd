@echo off
echo Building SvelteKit app in subdirectory...
cd akcelerator-landing-page
call npm ci
call npm run build

echo Copying Vercel output to root level...
cd ..
if not exist .vercel mkdir .vercel
xcopy /E /I /Y akcelerator-landing-page\.vercel\output .vercel\output

echo Build completed successfully!
dir .vercel\output\ 