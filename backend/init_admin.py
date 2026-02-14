#!/usr/bin/env python3
"""Initialize super admin account"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
from auth import get_password_hash
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def init_super_admin():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Check if super admin exists
    existing = await db.admins.find_one({"username": "Rebadion"})
    if existing:
        print("✓ Super admin already exists")
        client.close()
        return
    
    # Create super admin
    import uuid
    admin_data = {
        "id": str(uuid.uuid4()),
        "username": "Rebadion",
        "hashed_password": get_password_hash("Rebadion2010"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": None,
        "is_super_admin": True
    }
    
    await db.admins.insert_one(admin_data)
    print("✅ Super admin created successfully!")
    print(f"   Username: Rebadion")
    print(f"   Access: /system-control")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_super_admin())
