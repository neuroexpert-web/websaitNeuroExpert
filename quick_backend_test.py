#!/usr/bin/env python3
"""
Quick backend API verification test
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://smart-consult-app-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_api_root():
    """Test API root endpoint"""
    print("Testing API root endpoint...")
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Root endpoint: {data}")
            return True
        else:
            print(f"✗ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Root endpoint error: {str(e)}")
        return False

def test_contact_form_api():
    """Test Contact Form API endpoint"""
    print("Testing Contact Form API...")
    test_data = {
        "name": "Тестовый Клиент",
        "contact": "+7 999 123 4567", 
        "service": "Цифровой аудит",
        "message": "Хочу заказать аудит для своего бизнеса"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/contact",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get("success") == True:
                print("✓ Contact Form API working")
                return True
            else:
                print(f"✗ Contact Form API: success not true")
                return False
        else:
            print(f"✗ Contact Form API failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Contact Form API error: {str(e)}")
        return False

def test_ai_chat_basic():
    """Test basic AI Chat functionality"""
    print("Testing AI Chat basic functionality...")
    test_session_id = f"quick-test-{int(time.time())}"
    
    test_data = {
        "session_id": test_session_id,
        "message": "Привет, расскажите о ваших услугах",
        "model": "claude-sonnet"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/chat",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code == 200:
            response_data = response.json()
            if "response" in response_data and "session_id" in response_data:
                print("✓ AI Chat API working")
                return True
            else:
                print("✗ AI Chat API: invalid response structure")
                return False
        else:
            print(f"✗ AI Chat API failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ AI Chat API error: {str(e)}")
        return False

if __name__ == "__main__":
    print("QUICK BACKEND API VERIFICATION")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("-" * 50)
    
    results = []
    results.append(("API Root", test_api_root()))
    results.append(("Contact Form API", test_contact_form_api()))
    results.append(("AI Chat API", test_ai_chat_basic()))
    
    print("\n" + "=" * 40)
    print("QUICK TEST SUMMARY")
    print("=" * 40)
    
    passed = 0
    for test_name, result in results:
        status = "PASSED" if result else "FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("✅ All backend APIs working correctly")
    else:
        print("❌ Some backend APIs have issues")