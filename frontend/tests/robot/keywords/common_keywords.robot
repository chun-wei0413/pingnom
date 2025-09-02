*** Settings ***
Library    SeleniumLibrary
Resource   ../variables/test_config.robot

*** Keywords ***
Setup Browser And Navigate To App
    [Documentation]    開啟瀏覽器並導航到應用程式
    Open Browser    ${APP_URL}    ${BROWSER}    options=add_argument("--start-maximized")
    Set Browser Implicit Wait    ${DEFAULT_TIMEOUT}
    Wait For Page To Load
    
Wait For Page To Load
    [Documentation]    等待應用程式載入完成
    Wait Until Element Is Visible    text=把分散的朋友聚在一起    timeout=${DEFAULT_TIMEOUT}

Login With Account
    [Documentation]    使用指定帳號登入
    [Arguments]    ${email}    ${password}    ${display_name}
    
    # 檢查是否在歡迎頁面
    ${welcome_visible}=    Run Keyword And Return Status    Element Should Be Visible    text=Pingnom
    ${login_visible}=    Run Keyword And Return Status    Element Should Be Visible    text=歡迎回來
    
    # 如果在歡迎頁面但不在登入頁面，點擊"我已有帳號"
    Run Keyword If    ${welcome_visible} and not ${login_visible}    Click Element    text=我已有帳號
    Run Keyword If    ${welcome_visible} and not ${login_visible}    Wait Until Element Is Visible    text=歡迎回來    timeout=${DEFAULT_TIMEOUT}
    
    # 如果不在任何頁面，重新導航
    Run Keyword If    not ${login_visible}    Go To    ${APP_URL}
    Run Keyword If    not ${login_visible}    Wait For Page To Load
    Run Keyword If    not ${login_visible}    Click Element    text=我已有帳號
    Run Keyword If    not ${login_visible}    Wait Until Element Is Visible    text=歡迎回來    timeout=${DEFAULT_TIMEOUT}
    
    # 檢查快速登入按鈕
    ${quick_login_available}=    Run Keyword And Return Status    Element Should Be Visible    text=${display_name}
    
    Run Keyword If    ${quick_login_available}    Click Element    text=${display_name}
    ...    ELSE    Standard Login    ${email}    ${password}
    
    # 驗證登入成功
    Wait Until Element Is Visible    text=你好, ${display_name}！    timeout=${DEFAULT_TIMEOUT}

Standard Login
    [Documentation]    使用標準登入流程
    [Arguments]    ${email}    ${password}
    Input Text    input[placeholder*="Email"]    ${email}
    Input Text    input[placeholder*="密碼"]    ${password}
    Click Element    text=登入

Navigate To Friends Page
    [Documentation]    導航到朋友頁面
    Click Element    link:朋友
    # 等待朋友頁面載入
    ${error_visible}=    Run Keyword And Return Status    Element Should Be Visible    text=載入失敗
    Run Keyword If    ${error_visible}    Click Element    text=重試
    Run Keyword If    ${error_visible}    Sleep    2s
    
    # 驗證朋友頁面已載入
    Wait Until Element Is Visible    xpath=//text()[contains(., '朋友 (') or contains(., '還沒有朋友') or contains(., '邀請 (')]    timeout=${DEFAULT_TIMEOUT}

Navigate To Add Friend Page
    [Documentation]    導航到新增朋友頁面
    Click Element    css=[data-testid="add-friend-button"]
    Wait Until Element Is Visible    text=尋找新朋友    timeout=${DEFAULT_TIMEOUT}
    Wait Until Element Is Visible    input[placeholder*="輸入姓名或 Email"]    timeout=${DEFAULT_TIMEOUT}

Search For User
    [Documentation]    搜尋用戶
    [Arguments]    ${search_term}
    Input Text    input[placeholder*="輸入姓名或 Email"]    ${search_term}
    Click Element    css=[data-testid="search-users-button"]
    Sleep    3s    # 等待搜尋完成

Verify Search Results
    [Documentation]    驗證搜尋結果
    [Arguments]    ${user_name}    ${user_email}
    Wait Until Element Is Visible    text=${user_name}    timeout=${DEFAULT_TIMEOUT}
    Element Should Be Visible    text=${user_email}
    Element Should Be Visible    text=加好友

Send Friend Request
    [Documentation]    發送好友邀請
    [Arguments]    ${user_name}
    Click Element    text=加好友
    Wait Until Element Is Visible    text=已向 ${user_name} 發送好友邀請！    timeout=${DEFAULT_TIMEOUT}
    Click Element    text=確定

Accept Friend Request
    [Documentation]    接受好友邀請
    [Arguments]    ${requester_name}
    Wait Until Element Is Visible    text=${requester_name}    timeout=${DEFAULT_TIMEOUT}
    Click Element    text=接受
    
Reject Friend Request
    [Documentation]    拒絕好友邀請
    Click Element    text=拒絕

Switch To Friends Tab
    [Documentation]    切換到朋友頁籤
    [Arguments]    ${tab_name}    ${count}=${EMPTY}
    ${tab_text}=    Set Variable If    '${count}' != ''    ${tab_name} (${count})    ${tab_name}
    Click Element    text=${tab_text}
    Sleep    1s

Verify Friend In List
    [Documentation]    驗證朋友出現在列表中
    [Arguments]    ${friend_name}
    Wait Until Element Is Visible    text=${friend_name}    timeout=${DEFAULT_TIMEOUT}

Verify Empty Friends List
    [Documentation]    驗證朋友列表為空
    Element Should Be Visible    text=還沒有朋友

Take Debug Screenshot
    [Documentation]    截圖用於調試
    [Arguments]    ${filename}
    Capture Page Screenshot    ${filename}

Close All Browsers And Cleanup
    [Documentation]    清理測試環境
    Close All Browsers