#!/usr/bin/env python3
"""
Backend API Testing Script for NeuroExpert
Tests Contact Form API with Telegram Integration
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://tech-consult-pro-2.preview.emergentagent.com"
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
    
    if passed == total:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())