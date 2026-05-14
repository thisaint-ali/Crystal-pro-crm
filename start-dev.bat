@echo off
cd /d C:\Users\iokva\crystal-pro-crm
set PATH=C:\Program Files\nodejs;%PATH%
npm run dev > dev-server.log 2>&1
