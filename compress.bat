@echo off 
set work_path=C:\Users\Administrator\Desktop\wechat\uploads 
C: 
cd %work_path% 
for /f %%I in ('dir /a /b /s /od *') do (
::for /R %%I in (*) do ( 
echo %%~dpI%%~nxI
::echo %%~tI^|asd^|%%~nxI^|%%~dpI
convert %%~dpI%%~nxI -resize 640x640 %%~dpIthumbs\thumb_%%~nxI
) 
pause 