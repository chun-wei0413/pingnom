*** Settings ***
Documentation    完整好友邀請流程測試
...              使用 BDD 風格測試完整的好友邀請流程
...              Frank 邀請 Alice → Alice 接受 → 雙方成為好友
Library          SeleniumLibrary
Resource         ../keywords/common_keywords.robot
Resource         ../variables/test_config.robot
Suite Setup      Setup Test Environment
Suite Teardown   Cleanup Test Environment
Test Setup       Reset Browser State
Test Teardown    Take Screenshot If Failed

*** Variables ***
${FRANK_BROWSER}    frank_browser
${ALICE_BROWSER}    alice_browser

*** Test Cases ***
場景: 完整的好友邀請接受流程 - Frank 邀請 Alice，Alice 接受，雙方成為好友
    [Documentation]    
    ...    身為 Pingnom 的用戶們
    ...    當 Frank 向 Alice 發送好友邀請
    ...    並且 Alice 接受邀請後
    ...    兩人應該互相成為朋友
    [Tags]    integration    friend_flow    critical
    
    Given Frank 和 Alice 都是註冊用戶
    When Frank 登入並向 Alice 發送好友邀請
    And Alice 登入並查看收到的邀請
    And Alice 接受 Frank 的好友邀請
    Then Frank 和 Alice 應該互相出現在對方的朋友列表中
    And 邀請應該從待處理列表中移除

場景: 好友邀請被拒絕的流程 - Frank 邀請 Alice，Alice 拒絕
    [Documentation]    
    ...    身為 Pingnom 的用戶們
    ...    當 Frank 向 Alice 發送好友邀請
    ...    但 Alice 拒絕邀請後
    ...    兩人不應該成為朋友
    [Tags]    integration    friend_flow    rejection
    
    Given Frank 和 Alice 都是註冊用戶
    When Frank 登入並向 Alice 發送好友邀請
    And Alice 登入並查看收到的邀請
    And Alice 拒絕 Frank 的好友邀請
    Then Frank 和 Alice 都不應該在對方的朋友列表中
    And Alice 的邀請列表應該為空

*** Keywords ***
Setup Test Environment
    [Documentation]    設定測試環境，開啟兩個瀏覽器實例
    Open Browser    ${APP_URL}    ${BROWSER}    alias=${FRANK_BROWSER}    options=add_argument("--start-maximized")
    Set Browser Implicit Wait    ${DEFAULT_TIMEOUT}
    
    Open Browser    ${APP_URL}    ${BROWSER}    alias=${ALICE_BROWSER}    options=add_argument("--start-maximized")  
    Set Browser Implicit Wait    ${DEFAULT_TIMEOUT}

Cleanup Test Environment
    [Documentation]    清理測試環境
    Close All Browsers

Reset Browser State
    [Documentation]    重置瀏覽器狀態
    Switch Browser    ${FRANK_BROWSER}
    Go To    ${APP_URL}
    Wait For Page To Load
    
    Switch Browser    ${ALICE_BROWSER}
    Go To    ${APP_URL}
    Wait For Page To Load

Take Screenshot If Failed
    [Documentation]    測試失敗時截圖
    Run Keyword If Test Failed    Capture Page Screenshot    failed_test_{TEST_NAME}.png

Frank 和 Alice 都是註冊用戶
    [Documentation]    確認測試用戶存在
    Log    Frank Li 和 Alice Wang 是系統中的註冊用戶

Frank 登入並向 Alice 發送好友邀請
    [Documentation]    Frank 執行登入和發送邀請的完整流程
    Switch Browser    ${FRANK_BROWSER}
    
    # Step 1: Frank 登入
    Login With Account    ${FRANK_EMAIL}    ${FRANK_PASSWORD}    ${FRANK_DISPLAY_NAME}
    Take Debug Screenshot    frank_after_login.png
    
    # Step 2: 導航到朋友頁面
    Navigate To Friends Page
    Take Debug Screenshot    frank_friends_page.png
    
    # Step 3: 進入添加朋友頁面
    Navigate To Add Friend Page
    Take Debug Screenshot    frank_add_friend_page.png
    
    # Step 4: 搜尋 Alice
    Search For User    ${SEARCH_KEYWORD}
    Take Debug Screenshot    frank_search_results.png
    
    # Step 5: 發送好友邀請
    Send Friend Request    ${ALICE_DISPLAY_NAME}
    Take Debug Screenshot    frank_after_sending_request.png

Alice 登入並查看收到的邀請
    [Documentation]    Alice 登入並檢查邀請
    Switch Browser    ${ALICE_BROWSER}
    
    # Step 1: Alice 登入
    Login With Account    ${ALICE_EMAIL}    ${ALICE_PASSWORD}    ${ALICE_DISPLAY_NAME}
    Take Debug Screenshot    alice_after_login.png
    
    # Step 2: 導航到朋友頁面
    Navigate To Friends Page
    Take Debug Screenshot    alice_friends_page.png
    
    # Step 3: 檢查邀請頁籤
    ${invite_count}=    Get Text    xpath=//text()[contains(., '邀請 (')]
    Should Contain    ${invite_count}    邀請 (1)
    Take Debug Screenshot    alice_invite_tab.png

Alice 接受 Frank 的好友邀請
    [Documentation]    Alice 接受邀請
    Switch Browser    ${ALICE_BROWSER}
    
    # Step 1: 點擊邀請頁籤
    Switch To Friends Tab    邀請    1
    Take Debug Screenshot    alice_pending_invitations.png
    
    # Step 2: 驗證收到 Frank 的邀請
    Element Should Be Visible    text=${FRANK_DISPLAY_NAME}
    Element Should Be Visible    text=${FRANK_EMAIL}
    
    # Step 3: 點擊接受按鈕並處理確認對話框
    Handle Alert    Accept Friend Request    ACCEPT
    Click Element    text=接受
    
    # Step 4: 等待處理完成
    Sleep    3s
    Take Debug Screenshot    alice_after_accepting.png

Alice 拒絕 Frank 的好友邀請
    [Documentation]    Alice 拒絕邀請
    Switch Browser    ${ALICE_BROWSER}
    
    # Step 1: 點擊邀請頁籤
    Switch To Friends Tab    邀請    1
    
    # Step 2: 拒絕邀請
    Click Element    text=拒絕
    
    # Step 3: 等待處理完成
    Sleep    3s

Frank 和 Alice 應該互相出現在對方的朋友列表中
    [Documentation]    驗證雙方都在對方的朋友列表中
    
    # 驗證 Alice 的朋友列表中有 Frank
    Switch Browser    ${ALICE_BROWSER}
    Switch To Friends Tab    朋友    1
    Verify Friend In List    ${FRANK_DISPLAY_NAME}
    Take Debug Screenshot    alice_friends_list.png
    
    # 驗證 Frank 的朋友列表中有 Alice  
    Switch Browser    ${FRANK_BROWSER}
    Reload Page
    Navigate To Friends Page
    Switch To Friends Tab    朋友    1
    Verify Friend In List    ${ALICE_DISPLAY_NAME}
    Take Debug Screenshot    frank_friends_list.png

邀請應該從待處理列表中移除
    [Documentation]    驗證邀請已被處理
    Switch Browser    ${ALICE_BROWSER}
    Switch To Friends Tab    邀請    0
    Element Should Not Be Visible    text=${FRANK_DISPLAY_NAME}

Frank 和 Alice 都不應該在對方的朋友列表中
    [Documentation]    驗證拒絕後雙方不是朋友
    
    # 驗證 Alice 的朋友列表為空
    Switch Browser    ${ALICE_BROWSER}
    Switch To Friends Tab    朋友    0
    Verify Empty Friends List
    
    # 驗證 Frank 的朋友列表為空
    Switch Browser    ${FRANK_BROWSER}
    Reload Page  
    Navigate To Friends Page
    Switch To Friends Tab    朋友    0
    Verify Empty Friends List

Alice 的邀請列表應該為空
    [Documentation]    驗證邀請列表已清空
    Switch Browser    ${ALICE_BROWSER}
    Switch To Friends Tab    邀請    0
    Element Should Be Visible    text=沒有待處理邀請

Handle Alert
    [Documentation]    處理 JavaScript 對話框
    [Arguments]    ${expected_text}    ${action}=ACCEPT
    
    # 設定對話框處理器
    Run Keyword If    '${action}' == 'ACCEPT'    
    ...    Handle Alert    action=ACCEPT
    ...    ELSE
    ...    Handle Alert    action=DISMISS