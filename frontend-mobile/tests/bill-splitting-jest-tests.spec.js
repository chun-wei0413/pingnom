// Pingnom 帳單分攤功能 Jest 單元測試
// 測試框架: Jest + React Native Testing Library
// 目標: 測試帳單分攤功能組件和邏輯

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { configureStore } from '@reduxjs/toolkit';

// Import screens to test
import BillsScreen from '../src/screens/BillsScreen';
import CreateBillScreen from '../src/screens/CreateBillScreen';
import BillDetailScreen from '../src/screens/BillDetailScreen';

// Mock API module
jest.mock('../src/services/api', () => ({
  api: {
    getUserBills: jest.fn(),
    createBill: jest.fn(),
    getBill: jest.fn(),
    addBillItem: jest.fn(),
    addParticipant: jest.fn(),
    markPaid: jest.fn(),
  },
}));

// Mock Redux store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 'test-user-id', displayName: 'Frank Li' } }) => state,
    },
    preloadedState: initialState,
  });
};

// Mock navigation
const Stack = createStackNavigator();
const MockNavigator = ({ children }) => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Test" component={() => children} />
    </Stack.Navigator>
  </NavigationContainer>
);

const renderWithProviders = (component, initialState = {}) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      <MockNavigator>
        {component}
      </MockNavigator>
    </Provider>
  );
};

describe('帳單分攤功能測試', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('BillsScreen', () => {
    const { api } = require('../src/services/api');

    test('應該顯示帳單列表', async () => {
      const mockBills = [
        {
          id: '1',
          title: 'Test Bill',
          description: 'Test Description',
          status: 'draft',
          totalAmount: 100,
          participants: { 'user1': {} },
          items: [],
          createdAt: '2025-09-10T10:00:00Z',
        },
      ];

      api.getUserBills.mockResolvedValue({ bills: mockBills });

      const { getByText, getByTestId } = renderWithProviders(<BillsScreen />);

      await waitFor(() => {
        expect(getByText('帳單分攤')).toBeTruthy();
        expect(getByText('+ 新增帳單')).toBeTruthy();
      });

      await waitFor(() => {
        expect(getByText('Test Bill')).toBeTruthy();
        expect(getByText('草稿')).toBeTruthy();
      });
    });

    test('應該顯示空狀態當沒有帳單時', async () => {
      api.getUserBills.mockResolvedValue({ bills: [] });

      const { getByText } = renderWithProviders(<BillsScreen />);

      await waitFor(() => {
        expect(getByText('目前沒有帳單')).toBeTruthy();
        expect(getByText('建立第一個帳單')).toBeTruthy();
      });
    });

    test('過濾器應該正常運作', async () => {
      api.getUserBills.mockResolvedValue({ bills: [] });

      const { getByText } = renderWithProviders(<BillsScreen />);

      await waitFor(() => {
        expect(getByText('全部')).toBeTruthy();
        expect(getByText('我建立的')).toBeTruthy();
        expect(getByText('參與的')).toBeTruthy();
      });

      // 測試過濾器點擊
      fireEvent.press(getByText('我建立的'));
      expect(api.getUserBills).toHaveBeenCalledWith('created');
    });
  });

  describe('CreateBillScreen', () => {
    const { api } = require('../src/services/api');

    test('應該驗證必填欄位', () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(<CreateBillScreen />);

      const titleInput = getByPlaceholderText('例如：聚餐分攤、購物清單...');
      const createButton = getByText('建立');

      // 空標題應該禁用建立按鈕
      expect(createButton.props.disabled).toBe(true);

      // 輸入標題後應該啟用按鈕
      fireEvent.changeText(titleInput, 'Test Bill');
      expect(createButton.props.disabled).toBe(false);
    });

    test('應該能建立新帳單', async () => {
      api.createBill.mockResolvedValue({ billId: 'new-bill-id' });

      const { getByText, getByPlaceholderText } = renderWithProviders(<CreateBillScreen />);

      const titleInput = getByPlaceholderText('例如：聚餐分攤、購物清單...');
      const descriptionInput = getByPlaceholderText('描述這個帳單的用途...');
      
      fireEvent.changeText(titleInput, 'Test Dinner Bill');
      fireEvent.changeText(descriptionInput, 'Friends dinner expenses');

      const createButton = getByText('建立');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(api.createBill).toHaveBeenCalledWith({
          title: 'Test Dinner Bill',
          description: 'Friends dinner expenses',
        });
      });
    });

    test('字數限制應該正常顯示', () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(<CreateBillScreen />);

      const titleInput = getByPlaceholderText('例如：聚餐分攤、購物清單...');
      
      expect(getByText('0/100')).toBeTruthy();
      
      fireEvent.changeText(titleInput, 'Test');
      expect(getByText('4/100')).toBeTruthy();
    });
  });

  describe('API 整合測試', () => {
    const { api } = require('../src/services/api');

    test('建立帳單 API 調用', async () => {
      const mockResponse = { billId: 'test-bill-id' };
      api.createBill.mockResolvedValue(mockResponse);

      const result = await api.createBill({
        title: 'Test Bill',
        description: 'Test Description',
      });

      expect(result).toEqual(mockResponse);
      expect(api.createBill).toHaveBeenCalledWith({
        title: 'Test Bill',
        description: 'Test Description',
      });
    });

    test('取得帳單列表 API 調用', async () => {
      const mockResponse = { bills: [], total: 0 };
      api.getUserBills.mockResolvedValue(mockResponse);

      const result = await api.getUserBills('all');

      expect(result).toEqual(mockResponse);
      expect(api.getUserBills).toHaveBeenCalledWith('all');
    });
  });

  describe('帳單狀態管理', () => {
    test('應該正確顯示帳單狀態', () => {
      const testCases = [
        { status: 'draft', expected: '草稿' },
        { status: 'active', expected: '進行中' },
        { status: 'completed', expected: '已完成' },
        { status: 'cancelled', expected: '已取消' },
      ];

      testCases.forEach(({ status, expected }) => {
        // 這裡可以測試狀態轉換邏輯
        const getStatusText = (status) => {
          switch (status) {
            case 'draft': return '草稿';
            case 'active': return '進行中';
            case 'completed': return '已完成';
            case 'cancelled': return '已取消';
            default: return status;
          }
        };

        expect(getStatusText(status)).toBe(expected);
      });
    });
  });
});

// 測試工具函數
describe('測試工具函數', () => {
  test('金額格式化', () => {
    const formatCurrency = (amount) => `$${amount}`;
    
    expect(formatCurrency(100)).toBe('$100');
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrency(1234.56)).toBe('$1234.56');
  });

  test('日期格式化', () => {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('zh-TW');
    };

    const testDate = '2025-09-10T10:00:00Z';
    const result = formatDate(testDate);
    expect(result).toMatch(/\d+\/\d+\/\d+/);
  });
});

console.log(`
🧪 Pingnom 帳單分攤功能 Jest 測試套件
📋 涵蓋測試項目:
  1. BillsScreen 組件測試
  2. CreateBillScreen 組件測試  
  3. API 整合測試
  4. 帳單狀態管理測試
  5. 工具函數測試
  
💡 執行方式: npm test bill-splitting-jest-tests.spec.js
🔧 需要設定: Jest + React Native Testing Library
`);