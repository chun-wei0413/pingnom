@echo off
echo Starting Pingnom Frontend in Web Mode...
set WEBPACK_DEV_SERVER_PORT=19009
echo Using Webpack port: 19009
npx expo start --web --port 8092
pause