*** Settings ***
Documentation    基本測試，驗證 Robot Framework 和瀏覽器是否正常工作
Library          SeleniumLibrary
Resource         ../variables/test_config.robot

*** Test Cases ***
基本瀏覽器測試
    [Documentation]    簡單測試，確保能夠開啟瀏覽器並訪問前端應用
    [Tags]    basic
    
    Open Browser    ${APP_URL}    ${BROWSER}
    Set Browser Implicit Wait    5s
    
    # 等待任何內容加載
    Sleep    3s
    
    # 獲取頁面標題和內容進行調試
    ${title}=    Get Title
    Log    Page title: ${title}
    
    ${source}=    Get Source
    Log    Page source preview: ${source[:500]}
    
    # 取得頁面上的所有文字
    ${body_text}=    Get Text    css=body
    Log    Body text: ${body_text}
    
    # 檢查是否有任何內容
    Should Not Be Empty    ${title}
    
    Capture Page Screenshot    basic_test_screenshot.png
    
    Close Browser

測試前端連接
    [Documentation]    驗證能夠連接到前端服務並獲取基本內容
    [Tags]    connection
    
    Open Browser    ${APP_URL}    ${BROWSER}
    Set Browser Implicit Wait    10s
    
    # 等待頁面完全加載
    Sleep    5s
    
    # 檢查常見的前端元素
    ${has_pingnom}=    Run Keyword And Return Status    
    ...    Page Should Contain Element    xpath=//*[contains(text(), 'Pingnom')]
    
    ${has_react}=    Run Keyword And Return Status
    ...    Page Should Contain Element    id=root
    
    ${has_expo}=    Run Keyword And Return Status
    ...    Page Should Contain Element    xpath=//*[contains(text(), 'Expo')]
    
    Log    Has Pingnom: ${has_pingnom}
    Log    Has React root: ${has_react}
    Log    Has Expo: ${has_expo}
    
    # 截圖用於調試
    Capture Page Screenshot    connection_test_screenshot.png
    
    Close Browser