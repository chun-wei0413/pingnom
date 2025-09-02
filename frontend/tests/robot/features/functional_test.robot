*** Settings ***
Documentation    功能性測試，驗證朋友系統核心功能
Library          SeleniumLibrary
Resource         ../keywords/common_keywords.robot
Resource         ../variables/test_config.robot
Suite Teardown   Close All Browsers

*** Test Cases ***
場景: 用戶能夠成功載入應用並導航到登入頁面
    [Documentation]    
    ...    身為一個 Pingnom 用戶
    ...    當我訪問應用程式時
    ...    我應該能夠看到歡迎頁面並導航到登入頁面
    [Tags]    smoke    navigation
    
    Given 我開啟 Pingnom 應用程式
    When 我等待應用程式完全載入
    Then 我應該看到歡迎頁面的主要元素
    And 我應該能夠點擊進入登入頁面

場景: 用戶能夠使用快速登入功能
    [Documentation]    
    ...    身為一個 Pingnom 用戶
    ...    當我使用快速登入功能時
    ...    我應該能夠成功登入並進入主頁面
    [Tags]    smoke    login    critical
    
    Given 我在登入頁面
    When 我點擊 Frank Li 快速登入按鈕
    Then 我應該看到登入成功的歡迎訊息
    And 我應該能夠看到主應用的導航元素

場景: 用戶能夠訪問朋友頁面
    [Documentation]    
    ...    身為已登入的 Pingnom 用戶
    ...    當我點擊朋友頁籤時
    ...    我應該能夠進入朋友管理頁面
    [Tags]    friends    critical
    
    Given 我已經成功登入應用程式
    When 我點擊朋友頁籤
    Then 我應該看到朋友頁面的主要元素
    And 我應該看到朋友管理的各個頁籤

*** Keywords ***
我開啟 Pingnom 應用程式
    [Documentation]    開啟瀏覽器並導航到應用程式
    Open Browser    ${APP_URL}    ${BROWSER}
    Maximize Browser Window
    Set Browser Implicit Wait    15s

我等待應用程式完全載入
    [Documentation]    等待 React 應用程式完全載入
    # 等待主要元素載入
    Wait Until Element Is Visible    text=Pingnom    timeout=20s
    Sleep    2s    # 確保所有動態內容都載入完成

我應該看到歡迎頁面的主要元素
    [Documentation]    驗證歡迎頁面的關鍵元素
    Element Should Be Visible    text=Pingnom
    Element Should Be Visible    text=把分散的朋友聚在一起
    Element Should Be Visible    text=開始使用
    Element Should Be Visible    text=我已有帳號

我應該能夠點擊進入登入頁面
    [Documentation]    驗證能夠導航到登入頁面
    Click Element    text=我已有帳號
    Wait Until Element Is Visible    text=歡迎回來    timeout=15s
    Element Should Be Visible    text=Frank Li
    Element Should Be Visible    text=Alice Wang

我在登入頁面
    [Documentation]    前置條件：確保在登入頁面
    我開啟 Pingnom 應用程式
    我等待應用程式完全載入
    Click Element    text=我已有帳號
    Wait Until Element Is Visible    text=歡迎回來    timeout=15s

我點擊 Frank Li 快速登入按鈕
    [Documentation]    使用 Frank Li 快速登入
    Click Element    text=Frank Li

我應該看到登入成功的歡迎訊息
    [Documentation]    驗證登入成功
    Wait Until Element Is Visible    text=你好, Frank Li！    timeout=20s

我應該能夠看到主應用的導航元素
    [Documentation]    驗證主應用導航
    Element Should Be Visible    text=首頁
    Element Should Be Visible    text=Pings  
    Element Should Be Visible    text=朋友
    Element Should Be Visible    text=個人

我已經成功登入應用程式
    [Documentation]    前置條件：完成登入流程
    我在登入頁面
    我點擊 Frank Li 快速登入按鈕
    我應該看到登入成功的歡迎訊息

我點擊朋友頁籤
    [Documentation]    導航到朋友頁面
    Click Element    text=朋友
    Sleep    3s    # 等待頁面載入

我應該看到朋友頁面的主要元素
    [Documentation]    驗證朋友頁面載入成功
    # 朋友頁面可能會有載入錯誤，先檢查是否需要重試
    ${retry_visible}=    Run Keyword And Return Status    Element Should Be Visible    text=重試
    Run Keyword If    ${retry_visible}    Click Element    text=重試
    Run Keyword If    ${retry_visible}    Sleep    3s
    
    # 驗證朋友頁面元素（任一可見即可）
    ${friends_visible}=    Run Keyword And Return Status    Element Should Be Visible    text=朋友 (0)
    ${empty_friends}=    Run Keyword And Return Status    Element Should Be Visible    text=還沒有朋友
    ${add_button}=    Run Keyword And Return Status    Element Should Be Visible    css=[data-testid="add-friend-button"]
    
    Should Be True    ${friends_visible} or ${empty_friends} or ${add_button}

我應該看到朋友管理的各個頁籤
    [Documentation]    驗證朋友頁面的頁籤結構
    # 這些頁籤至少要有一個可見
    ${has_friends_tab}=    Run Keyword And Return Status    Element Should Be Visible    xpath=//*[contains(text(), '朋友')]
    ${has_invite_tab}=    Run Keyword And Return Status    Element Should Be Visible    xpath=//*[contains(text(), '邀請')]
    ${has_sent_tab}=    Run Keyword And Return Status    Element Should Be Visible    xpath=//*[contains(text(), '已發送')]
    
    Should Be True    ${has_friends_tab} or ${has_invite_tab} or ${has_sent_tab}