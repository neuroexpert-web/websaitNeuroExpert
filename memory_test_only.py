#!/usr/bin/env python3
"""
Focused test for AI Chat Extended Memory Fix
Tests the specific fix that loads conversation history from MongoDB
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://smart-consult-app-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

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

if __name__ == "__main__":
    print("AI CHAT EXTENDED MEMORY FIX TEST")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    result = test_ai_chat_extended_memory_fix()
    
    if result:
        print("\n🎉 CRITICAL TEST PASSED: Memory fix is working!")
        exit(0)
    else:
        print("\n❌ CRITICAL TEST FAILED: Memory fix needs attention")
        exit(1)