*** Variables ***
# 應用程式 URL
${APP_URL}                  http://localhost:19006

# 測試帳號
${FRANK_EMAIL}              testuser@pingnom.app  
${FRANK_PASSWORD}           TestPassword2024!
${FRANK_DISPLAY_NAME}       Frank Li

${ALICE_EMAIL}              alice@pingnom.app
${ALICE_PASSWORD}           AlicePassword2024!
${ALICE_DISPLAY_NAME}       Alice Wang

# 超時設定
${DEFAULT_TIMEOUT}          10s
${LONG_TIMEOUT}             30s
${SHORT_TIMEOUT}            5s

# 瀏覽器設定
${BROWSER}                  chrome
${HEADLESS}                 False

# 測試數據
${SEARCH_KEYWORD}           Alice
${FRIEND_REQUEST_MESSAGE}   你好！我希望能成為朋友一起聚餐！