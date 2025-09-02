*** Settings ***
Documentation    能正常運行的測試，使用實際頁面內容
Library          SeleniumLibrary
Resource         ../variables/test_config.robot

*** Test Cases ***
測試頁面載入和基本導航
    [Documentation]    測試能夠載入頁面並進行基本導航操作
    [Tags]    working
    
    Open Browser    ${APP_URL}    ${BROWSER}
    Maximize Browser Window
    Set Browser Implicit Wait    10s
    
    # 等待頁面載入
    Sleep    5s
    
    # 檢查 Pingnom 標題是否存在
    Wait Until Element Is Visible    text=Pingnom    timeout=10s
    
    # 檢查主要描述文字
    Element Should Be Visible    text=把分散的朋友聚在一起
    
    # 檢查功能描述
    Element Should Be Visible    text=智能位置推薦
    Element Should Be Visible    text=朋友群組管理
    Element Should Be Visible    text=快速 Ping 邀請
    
    # 檢查操作按鈕
    Element Should Be Visible    text=開始使用
    Element Should Be Visible    text=我已有帳號
    
    # 截圖記錄
    Capture Page Screenshot    working_test_homepage.png
    
    Close Browser

測試登入頁面導航
    [Documentation]    測試能夠導航到登入頁面
    [Tags]    working    navigation
    
    Open Browser    ${APP_URL}    ${BROWSER}
    Maximize Browser Window
    Set Browser Implicit Wait    10s
    
    # 等待頁面載入
    Wait Until Element Is Visible    text=Pingnom    timeout=10s
    
    # 點擊「我已有帳號」進入登入頁面
    Click Element    text=我已有帳號
    
    # 等待登入頁面載入
    Wait Until Element Is Visible    text=歡迎回來    timeout=10s
    
    # 檢查登入表單元素
    Element Should Be Visible    input[placeholder*="Email"]
    Element Should Be Visible    input[type="password"]
    Element Should Be Visible    text=登入
    
    # 檢查快速登入按鈕
    Element Should Be Visible    text=Frank Li
    Element Should Be Visible    text=Alice Wang
    
    # 截圖記錄
    Capture Page Screenshot    working_test_loginpage.png
    
    Close Browser

測試快速登入功能
    [Documentation]    測試 Frank Li 快速登入功能
    [Tags]    working    login
    
    Open Browser    ${APP_URL}    ${BROWSER}
    Maximize Browser Window
    Set Browser Implicit Wait    10s
    
    # 導航到登入頁面
    Wait Until Element Is Visible    text=Pingnom    timeout=10s
    Click Element    text=我已有帳號
    Wait Until Element Is Visible    text=歡迎回來    timeout=10s
    
    # 使用 Frank Li 快速登入
    Click Element    text=Frank Li
    
    # 驗證登入成功
    Wait Until Element Is Visible    text=你好, Frank Li！    timeout=15s
    
    # 檢查主頁面元素
    Element Should Be Visible    text=首頁
    Element Should Be Visible    text=Pings
    Element Should Be Visible    text=朋友
    Element Should Be Visible    text=個人
    
    # 截圖記錄
    Capture Page Screenshot    working_test_dashboard.png
    
    Close Browser