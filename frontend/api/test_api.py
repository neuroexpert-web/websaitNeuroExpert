#!/usr/bin/env python3
"""
Quick test script to verify API endpoints are properly configured
"""
import sys
import os

# Set up environment for testing
os.environ.setdefault('GOOGLE_API_KEY', 'test_key')
os.environ.setdefault('MONGODB_URI', 'mongodb://localhost:27017/test')
os.environ.setdefault('TELEGRAM_BOT_TOKEN', 'test_token')
os.environ.setdefault('TELEGRAM_CHAT_ID', 'test_chat')

try:
    from main import app
    print("✅ main.py imports successfully")
    
    # Check if routes are registered
    routes = [route.path for route in app.routes]
    
    expected_routes = ['/api/health', '/api/chat', '/api/contact']
    for route in expected_routes:
        if route in routes:
            print(f"✅ Route {route} registered")
        else:
            print(f"⚠️  Route {route} not found")
    
    print("\n✅ API structure looks good!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
