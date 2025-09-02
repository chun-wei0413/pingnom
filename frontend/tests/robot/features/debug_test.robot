*** Settings ***
Documentation    調試測試，檢查實際的 DOM 內容
Library          SeleniumLibrary
Resource         ../variables/test_config.robot

*** Test Cases ***
調試頁面內容
    [Documentation]    檢查頁面實際載入的內容
    [Tags]    debug
    
    Open Browser    ${APP_URL}    ${BROWSER}
    Maximize Browser Window
    Set Browser Implicit Wait    5s
    
    # 等待頁面載入
    Sleep    10s
    
    # 獲取頁面標題
    ${title}=    Get Title
    Log    頁面標題: ${title}
    
    # 獲取頁面所有文字內容
    ${page_text}=    Get Text    css=body
    Log    頁面文字內容: ${page_text}
    
    # 獲取頁面 HTML 源碼（前1000字符）
    ${source}=    Get Source
    ${source_preview}=    Set Variable    ${source[:1000]}
    Log    頁面HTML預覽: ${source_preview}
    
    # 檢查 root 元素
    ${root_exists}=    Run Keyword And Return Status    Element Should Be Visible    id=root
    Log    Root 元素存在: ${root_exists}
    
    # 檢查是否有任何包含 "Pingnom" 的元素
    ${pingnom_elements}=    Get WebElements    xpath=//*[contains(text(), 'Pingnom')]
    ${pingnom_count}=    Get Length    ${pingnom_elements}
    Log    包含 Pingnom 的元素數量: ${pingnom_count}
    
    # 檢查是否有任何包含中文的元素
    ${chinese_elements}=    Get WebElements    xpath=//*[contains(text(), '把')]
    ${chinese_count}=    Get Length    ${chinese_elements}
    Log    包含中文的元素數量: ${chinese_count}
    
    # 截圖調試
    Capture Page Screenshot    debug_page_content.png
    
    # 檢查是否是 React 應用載入問題
    ${react_loading}=    Run Keyword And Return Status    
    ...    Element Should Be Visible    xpath=//*[contains(text(), 'Loading') or contains(text(), '載入')]
    Log    React 載入狀態: ${react_loading}
    
    # 等待更長時間再次檢查
    Sleep    10s
    Capture Page Screenshot    debug_page_after_wait.png
    
    ${page_text_after}=    Get Text    css=body
    Log    等待後頁面文字: ${page_text_after}
    
    Close Browser