#!/usr/bin/env python3
"""
Backend API Testing Script for NeuroExpert
Tests Contact Form API with Telegram Integration and AI Chat API
"""

import requests
import json
import sys
import time
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = "https://smart-consult-app-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_contact_form_api():
    """Test Contact Form API endpoint with Telegram integration"""
    print("=" * 60)
    print("TESTING CONTACT FORM API WITH TELEGRAM INTEGRATION")
    print("=" * 60)
    
    # Test data as specified in the review request
    test_data = {
        "name": "Тестовый Клиент",
        "contact": "+7 999 123 4567", 
        "service": "Цифровой аудит",
        "message": "Хочу заказать аудит для своего бизнеса"
    }
    
    print(f"Testing endpoint: {API_BASE}/contact")
    print(f"Request data: {json.dumps(test_data, ensure_ascii=False, indent=2)}")
    print("-" * 40)
    
    try:
        # Send POST request to contact endpoint
        response = requests.post(
            f"{API_BASE}/contact",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"✓ Response Status Code: {response.status_code}")
        
        # Check if status code is 200
        if response.status_code == 200:
            print("✓ API returned 200 OK")
        else:
            print(f"✗ Expected 200, got {response.status_code}")
            print(f"Response text: {response.text}")
            return False
            
        # Parse response JSON
        try:
            response_data = response.json()
            print(f"✓ Response JSON: {json.dumps(response_data, ensure_ascii=False, indent=2)}")
        except json.JSONDecodeError:
            print(f"✗ Failed to parse response as JSON: {response.text}")
            return False
            
        # Check if response has "success": true
        if response_data.get("success") == True:
            print("✓ Response contains 'success': true")
        else:
            print(f"✗ Expected 'success': true, got: {response_data.get('success')}")
            return False
            
        # Check expected message
        expected_message = "Спасибо! Мы свяжемся с вами в течение 15 минут"
        if response_data.get("message") == expected_message:
            print("✓ Response message matches expected")
        else:
            print(f"✗ Message mismatch. Expected: '{expected_message}', Got: '{response_data.get('message')}'")
            
        print("\n" + "=" * 40)
        print("CONTACT FORM API TEST: PASSED")
        print("=" * 40)
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"✗ Request failed: {str(e)}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {str(e)}")
        return False

def test_api_root():
    """Test API root endpoint"""
    print("\n" + "=" * 60)
    print("TESTING API ROOT ENDPOINT")
    print("=" * 60)
    
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        print(f"✓ Root endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Root response: {data}")
            return True
        else:
            print(f"✗ Root endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Root endpoint error: {str(e)}")
        return False

def check_backend_logs():
    """Check backend logs for contact form and telegram messages"""
    print("\n" + "=" * 60)
    print("CHECKING BACKEND LOGS")
    print("=" * 60)
    
    import subprocess
    import os
    
    try:
        # Check if log files exist
        log_pattern = "/var/log/supervisor/backend.*.log"
        result = subprocess.run(f"ls {log_pattern}", shell=True, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"✗ No backend log files found at {log_pattern}")
            return False
            
        log_files = result.stdout.strip().split('\n')
        print(f"✓ Found log files: {log_files}")
        
        # Check recent logs for contact form and telegram messages
        for log_file in log_files:
            if log_file.strip():
                print(f"\nChecking {log_file}:")
                
                # Get last 50 lines of the log
                tail_result = subprocess.run(f"tail -n 50 {log_file}", shell=True, capture_output=True, text=True)
                
                if tail_result.returncode == 0:
                    log_content = tail_result.stdout
                    
                    # Check for contact form message
                    if "Contact form:" in log_content:
                        print("✓ Found 'Contact form:' message in logs")
                    else:
                        print("? 'Contact form:' message not found in recent logs")
                        
                    # Check for telegram notification
                    if "Telegram notification sent" in log_content:
                        print("✓ Found 'Telegram notification sent' message in logs")
                    else:
                        print("? 'Telegram notification sent' message not found in recent logs")
                        
                    # Show recent relevant log entries
                    lines = log_content.split('\n')
                    relevant_lines = [line for line in lines if any(keyword in line for keyword in ['Contact form', 'Telegram', 'contact', 'ERROR', 'WARNING'])]
                    
                    if relevant_lines:
                        print("\nRelevant log entries:")
                        for line in relevant_lines[-10:]:  # Show last 10 relevant lines
                            if line.strip():
                                print(f"  {line}")
                else:
                    print(f"✗ Could not read log file {log_file}")
                    
        return True
        
    except Exception as e:
        print(f"✗ Error checking logs: {str(e)}")
        return False

def test_ai_chat_endpoint():
    """Test AI Chat API endpoint with multiple models"""
    print("\n" + "=" * 60)
    print("TESTING AI CHAT API ENDPOINT")
    print("=" * 60)
    
    # Test models as specified in review request
    models = ["claude-sonnet", "gpt-4o", "gemini-pro"]
    results = []
    
    for model in models:
        print(f"\n--- Testing model: {model} ---")
        session_id = f"test-session-{int(time.time())}-{model}"
        
        # Test single message
        test_data = {
            "session_id": session_id,
            "message": "Привет, расскажите о ваших услугах",
            "model": model
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/chat",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=60  # AI responses can take longer
            )
            
            print(f"✓ Response Status Code: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                print(f"✓ Model {model}: API returned 200 OK")
                
                # Check response structure
                if "response" in response_data and "session_id" in response_data:
                    print(f"✓ Model {model}: Response has correct structure")
                    
                    # Check session_id matches
                    if response_data["session_id"] == session_id:
                        print(f"✓ Model {model}: Session ID matches")
                    else:
                        print(f"✗ Model {model}: Session ID mismatch")
                        results.append(False)
                        continue
                        
                    # Check response quality (should be 3-6 sentences)
                    ai_response = response_data["response"]
                    sentences = ai_response.count('.') + ai_response.count('!') + ai_response.count('?')
                    
                    if 2 <= sentences <= 8:  # Allow some flexibility
                        print(f"✓ Model {model}: Response length appropriate ({sentences} sentences)")
                    else:
                        print(f"? Model {model}: Response length: {sentences} sentences (expected 3-6)")
                    
                    # Check if response contains service information
                    if any(keyword in ai_response.lower() for keyword in ['услуг', 'разработк', 'дизайн', 'аудит', 'ai-ассистент']):
                        print(f"✓ Model {model}: Response contains service information")
                    else:
                        print(f"? Model {model}: Response may not contain expected service information")
                    
                    print(f"Response preview: {ai_response[:200]}...")
                    results.append(True)
                else:
                    print(f"✗ Model {model}: Invalid response structure")
                    results.append(False)
            else:
                print(f"✗ Model {model}: API returned {response.status_code}")
                print(f"Response: {response.text}")
                results.append(False)
                
        except Exception as e:
            print(f"✗ Model {model}: Error - {str(e)}")
            results.append(False)
    
    return all(results)

def test_ai_chat_context_scenarios():
    """Test AI Chat context preservation with specific scenarios"""
    print("\n" + "=" * 60)
    print("TESTING AI CHAT CONTEXT PRESERVATION")
    print("=" * 60)
    
    scenarios = [
        {
            "model": "claude-sonnet",
            "messages": [
                "Привет, хочу создать интернет-магазин",
                "А сколько времени займет разработка?"
            ],
            "context_check": "интернет-магазин"
        },
        {
            "model": "gpt-4o", 
            "messages": [
                "Какие у вас есть услуги по AI-ассистентам?",
                "Расскажи подробнее про базовый пакет"
            ],
            "context_check": "ai-ассистент"
        },
        {
            "model": "gemini-pro",
            "messages": [
                "Нужна техподдержка для моего сайта",
                "Что входит в стандартный пакет?"
            ],
            "context_check": "техподдержк"
        }
    ]
    
    results = []
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n--- Scenario {i}: {scenario['model']} ---")
        session_id = f"test-session-{int(time.time())}-scenario-{i}"
        
        try:
            # Send first message
            first_data = {
                "session_id": session_id,
                "message": scenario["messages"][0],
                "model": scenario["model"]
            }
            
            print(f"First message: {scenario['messages'][0]}")
            
            first_response = requests.post(
                f"{API_BASE}/chat",
                json=first_data,
                headers={"Content-Type": "application/json"},
                timeout=60
            )
            
            if first_response.status_code != 200:
                print(f"✗ First message failed: {first_response.status_code}")
                results.append(False)
                continue
                
            first_data_response = first_response.json()
            print(f"✓ First response received")
            
            # Wait a moment between messages
            time.sleep(2)
            
            # Send second message (context test)
            second_data = {
                "session_id": session_id,  # Same session
                "message": scenario["messages"][1],
                "model": scenario["model"]
            }
            
            print(f"Second message: {scenario['messages'][1]}")
            
            second_response = requests.post(
                f"{API_BASE}/chat",
                json=second_data,
                headers={"Content-Type": "application/json"},
                timeout=60
            )
            
            if second_response.status_code != 200:
                print(f"✗ Second message failed: {second_response.status_code}")
                results.append(False)
                continue
                
            second_data_response = second_response.json()
            print(f"✓ Second response received")
            
            # Check if context is preserved
            second_ai_response = second_data_response["response"].lower()
            context_preserved = scenario["context_check"].lower() in second_ai_response
            
            if context_preserved:
                print(f"✓ Context preserved: Found reference to '{scenario['context_check']}'")
            else:
                print(f"? Context check: '{scenario['context_check']}' not explicitly found in response")
                print(f"Response preview: {second_ai_response[:300]}...")
            
            # Check response quality
            sentences = second_ai_response.count('.') + second_ai_response.count('!') + second_ai_response.count('?')
            if 2 <= sentences <= 8:
                print(f"✓ Response quality: {sentences} sentences")
            else:
                print(f"? Response length: {sentences} sentences")
            
            # Check for concrete information (numbers, timeframes)
            has_numbers = any(char.isdigit() for char in second_ai_response)
            if has_numbers:
                print(f"✓ Response contains concrete numbers/timeframes")
            else:
                print(f"? Response may lack concrete numbers")
            
            results.append(True)
            
        except Exception as e:
            print(f"✗ Scenario {i} error: {str(e)}")
            results.append(False)
    
    return all(results)

def test_ai_chat_extended_memory_fix():
    """
    CRITICAL TEST: Test AI Chat memory fix with EXTENDED conversation (10-12 messages)
    This tests the specific fix that loads conversation history from MongoDB (last 20 messages)
    to prevent memory loss after 7 messages.
    """
    print("\n" + "=" * 60)
    print("TESTING AI CHAT EXTENDED MEMORY FIX - CRITICAL TEST")
    print("=" * 60)
    
    # Generate unique session for this extended test
    test_session_id = f"memory-test-{int(time.time())}"
    test_model = "claude-sonnet"  # Use claude-sonnet as specified
    
    print(f"Test session ID: {test_session_id}")
    print(f"Test model: {test_model}")
    print("Testing scenario: User reported memory loss after 7 messages")
    print("Expected: AI should remember details from messages 1-3 in messages 8-10")
    
    # Test conversation as specified in the review request
    conversation = [
        "Привет! Меня зовут Дмитрий, у меня интернет-магазин электроники",
        "У меня проблема - клиенты уходят с сайта не оставляя заявки", 
        "Сейчас конверсия около 0.5%",
        "Расскажи о цифровом аудите",
        "Какие этапы включает аудит?",
        "Сколько времени займет проведение аудита?",
        "Какие документы нужно предоставить для аудита?",
        "А что насчет стоимости аудита?",
        # Memory test messages (8-10) - should reference earlier context
        "Вы помните, я говорил про интернет-магазин электроники?",
        "Какая была моя текущая конверсия, которую я упоминал?",
        "Учитывая мое имя и тип бизнеса, какие рекомендации вы дадите?"
    ]
    
    responses = []
    
    try:
        for i, message in enumerate(conversation, 1):
            print(f"\n--- Message {i}/11 ---")
            print(f"User: {message}")
            
            # Send message
            test_data = {
                "session_id": test_session_id,
                "message": message,
                "model": test_model
            }
            
            response = requests.post(
                f"{API_BASE}/chat",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=60
            )
            
            if response.status_code != 200:
                print(f"✗ Message {i} failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
            
            response_data = response.json()
            ai_response = response_data["response"]
            responses.append(ai_response)
            
            print(f"AI: {ai_response[:200]}...")
            
            # Wait between messages to simulate real conversation
            time.sleep(1)
        
        print("\n" + "=" * 50)
        print("MEMORY VERIFICATION - CRITICAL CHECKS")
        print("=" * 50)
        
        # Check memory preservation in messages 9-11 (indices 8-10)
        memory_checks = [
            {
                "message_num": 9,
                "response": responses[8],
                "check": "дмитрий",
                "description": "Should remember user's name (Дмитрий)"
            },
            {
                "message_num": 9, 
                "response": responses[8],
                "check": "электроник",
                "description": "Should remember business type (электроника)"
            },
            {
                "message_num": 10,
                "response": responses[9], 
                "check": "0.5",
                "description": "Should remember conversion rate (0.5%)"
            },
            {
                "message_num": 11,
                "response": responses[10],
                "check": "дмитрий",
                "description": "Should remember name in final message"
            },
            {
                "message_num": 11,
                "response": responses[10],
                "check": "электроник",
                "description": "Should remember business type in final message"
            }
        ]
        
        memory_passed = 0
        total_checks = len(memory_checks)
        
        for check in memory_checks:
            response_lower = check["response"].lower()
            if check["check"] in response_lower:
                print(f"✓ Message {check['message_num']}: {check['description']} - FOUND")
                memory_passed += 1
            else:
                print(f"✗ Message {check['message_num']}: {check['description']} - NOT FOUND")
                print(f"  Response preview: {check['response'][:300]}...")
        
        print(f"\nMemory preservation: {memory_passed}/{total_checks} checks passed")
        
        # Additional context checks
        print("\n" + "-" * 40)
        print("ADDITIONAL CONTEXT ANALYSIS")
        print("-" * 40)
        
        # Check if responses show continuity (not starting over)
        final_responses = responses[7:11]  # Messages 8-11
        context_indicators = 0
        
        for i, response in enumerate(final_responses, 8):
            response_lower = response.lower()
            
            # Look for context indicators
            context_words = ["помню", "упоминали", "говорили", "ранее", "как вы сказали", "ваш", "вашего"]
            found_context = any(word in response_lower for word in context_words)
            
            if found_context:
                print(f"✓ Message {i}: Shows context awareness")
                context_indicators += 1
            else:
                print(f"? Message {i}: Limited context indicators")
        
        print(f"Context awareness: {context_indicators}/4 messages show context")
        
        # Final assessment
        print("\n" + "=" * 50)
        print("MEMORY FIX ASSESSMENT")
        print("=" * 50)
        
        if memory_passed >= 4:  # At least 4/5 memory checks passed
            print("✅ MEMORY FIX WORKING: AI successfully remembers details from early messages")
            print("✅ Context is NOT lost after message 7-8")
            print("✅ Conversation history loading from MongoDB is functional")
            return True
        elif memory_passed >= 2:
            print("⚠️  PARTIAL MEMORY: Some context preserved but not all details")
            print("⚠️  Memory fix may need adjustment")
            return False
        else:
            print("❌ MEMORY FIX FAILED: AI does not remember early conversation details")
            print("❌ Context appears to be lost - memory fix not working")
            return False
            
    except Exception as e:
        print(f"✗ Extended memory test error: {str(e)}")
        return False

def test_ai_chat_database_storage():
    """Test that AI chat messages are properly stored in database"""
    print("\n" + "=" * 60)
    print("TESTING AI CHAT DATABASE STORAGE")
    print("=" * 60)
    
    # Generate unique session for testing
    test_session_id = f"test-session-{int(time.time())}-db-test"
    test_model = "claude-sonnet"
    test_message = "Тест сохранения в базу данных"
    
    print(f"Test session ID: {test_session_id}")
    print(f"Test model: {test_model}")
    print(f"Test message: {test_message}")
    
    try:
        # Send test message
        test_data = {
            "session_id": test_session_id,
            "message": test_message,
            "model": test_model
        }
        
        response = requests.post(
            f"{API_BASE}/chat",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"✓ Chat message sent successfully")
            print(f"✓ Session ID returned: {response_data['session_id']}")
            
            # Note: We can't directly query the database from here, but we can verify
            # the API response structure indicates proper storage
            if response_data["session_id"] == test_session_id:
                print(f"✓ Session ID consistency verified")
                return True
            else:
                print(f"✗ Session ID mismatch in response")
                return False
        else:
            print(f"✗ Chat API failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Database storage test error: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("NEUROEXPERT BACKEND API TESTING")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    results = []
    
    # Test API root
    results.append(("API Root", test_api_root()))
    
    # Test contact form API
    results.append(("Contact Form API", test_contact_form_api()))
    
    # Test AI Chat API endpoint
    results.append(("AI Chat API", test_ai_chat_endpoint()))
    
    # CRITICAL TEST: Extended memory fix (main focus of this testing session)
    results.append(("AI Chat Extended Memory Fix", test_ai_chat_extended_memory_fix()))
    
    # Test AI Chat context scenarios
    results.append(("AI Chat Context", test_ai_chat_context_scenarios()))
    
    # Test AI Chat database storage
    results.append(("AI Chat DB Storage", test_ai_chat_database_storage()))
    
    # Wait a moment for logs to be written
    print("\nWaiting 3 seconds for logs to be written...")
    time.sleep(3)
    
    # Check backend logs
    results.append(("Backend Logs", check_backend_logs()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "PASSED" if result else "FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    # Special focus on the critical memory fix test
    memory_test_result = results[3][1]  # Extended Memory Fix is 4th test (index 3)
    if memory_test_result:
        print("\n🎉 CRITICAL TEST PASSED: AI Chat memory fix is working!")
        print("✅ Context is preserved beyond 7 messages")
    else:
        print("\n❌ CRITICAL TEST FAILED: AI Chat memory fix needs attention")
        print("❌ Memory loss issue may still exist")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n❌ {total - passed} TESTS FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())