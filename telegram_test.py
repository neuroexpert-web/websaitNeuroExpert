#!/usr/bin/env python3
"""
Test Telegram Bot Integration
"""

import aiohttp
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')

async def test_telegram_bot():
    """Test Telegram bot configuration"""
    print("=" * 50)
    print("TESTING TELEGRAM BOT CONFIGURATION")
    print("=" * 50)
    
    if not TELEGRAM_BOT_TOKEN:
        print("✗ TELEGRAM_BOT_TOKEN not found in environment")
        return False
        
    print(f"✓ Bot token found: {TELEGRAM_BOT_TOKEN[:10]}...")
    
    # Test bot info
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe"
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✓ Bot info: {data}")
                    return True
                else:
                    print(f"✗ Bot API error: {response.status}")
                    text = await response.text()
                    print(f"Response: {text}")
                    return False
    except Exception as e:
        print(f"✗ Error testing bot: {str(e)}")
        return False

async def test_telegram_send():
    """Test sending message to Telegram"""
    print("\n" + "=" * 50)
    print("TESTING TELEGRAM MESSAGE SENDING")
    print("=" * 50)
    
    # The current implementation uses bot token as chat_id, which is incorrect
    # Let's test the correct way
    try:
        # First, let's see what chat_id the current code is using
        chat_id = TELEGRAM_BOT_TOKEN.split(':')[0]
        print(f"Current chat_id being used: {chat_id}")
        
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        message = "Test message from NeuroExpert backend"
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json={
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML"
            }) as response:
                if response.status == 200:
                    print("✓ Message sent successfully")
                    return True
                else:
                    print(f"✗ Send message error: {response.status}")
                    text = await response.text()
                    print(f"Response: {text}")
                    
                    # The issue is likely that we need a proper chat_id
                    # Let's check if we can get updates to see available chats
                    return False
                    
    except Exception as e:
        print(f"✗ Error sending message: {str(e)}")
        return False

async def main():
    """Run telegram tests"""
    print("TELEGRAM BOT INTEGRATION TEST")
    
    bot_ok = await test_telegram_bot()
    send_ok = await test_telegram_send()
    
    print("\n" + "=" * 50)
    print("TELEGRAM TEST SUMMARY")
    print("=" * 50)
    print(f"Bot Configuration: {'PASSED' if bot_ok else 'FAILED'}")
    print(f"Message Sending: {'PASSED' if send_ok else 'FAILED'}")
    
    if not send_ok:
        print("\n⚠️  TELEGRAM INTEGRATION ISSUE IDENTIFIED:")
        print("The current implementation uses bot token as chat_id, which is incorrect.")
        print("To fix this, you need to:")
        print("1. Start a chat with the bot")
        print("2. Get the correct chat_id from bot updates")
        print("3. Use that chat_id instead of the bot token")

if __name__ == "__main__":
    asyncio.run(main())