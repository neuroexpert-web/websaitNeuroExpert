#!/usr/bin/env python3
"""
Test MongoDB Database Connection and Data Storage
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime

# Load environment variables
ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

async def test_mongodb_connection():
    """Test MongoDB connection and check contact form data"""
    print("=" * 50)
    print("TESTING MONGODB CONNECTION AND DATA")
    print("=" * 50)
    
    try:
        # Connect to MongoDB
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ['DB_NAME']
        
        print(f"✓ MongoDB URL: {mongo_url}")
        print(f"✓ Database Name: {db_name}")
        
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Test connection
        await client.admin.command('ping')
        print("✓ MongoDB connection successful")
        
        # Check contact forms collection
        contact_forms = db.contact_forms
        
        # Get recent contact forms (last 10)
        cursor = contact_forms.find().sort("timestamp", -1).limit(10)
        forms = await cursor.to_list(length=10)
        
        print(f"\n✓ Found {len(forms)} contact form records")
        
        if forms:
            print("\nRecent contact form submissions:")
            for i, form in enumerate(forms, 1):
                timestamp = form.get('timestamp', 'Unknown')
                name = form.get('name', 'Unknown')
                service = form.get('service', 'Unknown')
                contact = form.get('contact', 'Unknown')
                
                print(f"{i}. {timestamp} - {name} ({service}) - {contact}")
                
                # Check if our test submission is there
                if name == "Тестовый Клиент" and service == "Цифровой аудит":
                    print("   ✓ Found our test submission!")
        
        # Check chat messages collection
        chat_messages = db.chat_messages
        chat_count = await chat_messages.count_documents({})
        print(f"\n✓ Found {chat_count} chat message records")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"✗ MongoDB error: {str(e)}")
        return False

async def main():
    """Run database tests"""
    print("MONGODB DATABASE TEST")
    
    db_ok = await test_mongodb_connection()
    
    print("\n" + "=" * 50)
    print("DATABASE TEST SUMMARY")
    print("=" * 50)
    print(f"MongoDB Connection & Data: {'PASSED' if db_ok else 'FAILED'}")

if __name__ == "__main__":
    asyncio.run(main())