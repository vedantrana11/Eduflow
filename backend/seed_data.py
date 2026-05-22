import asyncio
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
import random
import bcrypt
from bson import ObjectId

client = MongoClient("mongodb://localhost:27017/")
db = client["eduflow"]

db.users.delete_many({})
db.leads.delete_many({})
db.tasks.delete_many({})
db.messages.delete_many({})

now = datetime.now(timezone.utc)

salt = bcrypt.gensalt()
real_hash = bcrypt.hashpw(b"EduFlow@123", salt).decode("utf-8")

admin_id = ObjectId()
manager_id = ObjectId()
counselor_id = ObjectId()

users = [
    {
        "_id": admin_id,
        "email": "admin@eduflow.ai",
        "name": "Admin User",
        "role": "admin",
        "password_hash": real_hash,
        "is_active": True,
        "organization_id": "default",
        "created_at": now,
        "updated_at": now
    },
    {
        "_id": manager_id,
        "email": "manager@eduflow.ai",
        "name": "Manager User",
        "role": "manager",
        "password_hash": real_hash,
        "is_active": True,
        "organization_id": "default",
        "created_at": now,
        "updated_at": now
    },
    {
        "_id": counselor_id,
        "email": "counselor@eduflow.ai",
        "name": "Sarah Counselor",
        "role": "counselor",
        "password_hash": real_hash,
        "is_active": True,
        "organization_id": "default",
        "created_at": now,
        "updated_at": now
    }
]
db.users.insert_many(users)

stages = ["new", "contacted", "interested", "documents_pending", "applied", "converted", "lost"]
sources = ["Website", "Instagram", "Referral", "WhatsApp", "Facebook"]
courses = ["MBA", "MS Computer Science", "BBA", "Data Science", "Design"]
countries = ["USA", "UK", "Canada", "Australia"]

leads_data = []
lead_ids = []
for i in range(1, 20):
    lead_id = ObjectId()
    lead_ids.append(lead_id)
    stage = random.choice(stages)
    
    base_score = stages.index(stage) * 15
    score = min(100, max(0, base_score + random.randint(-10, 20)))
    
    leads_data.append({
        "_id": lead_id,
        "name": f"Demo Student {i}",
        "phone": f"+100000000{i:02d}",
        "email": f"student{i}@example.com",
        "country_interest": random.choice(countries),
        "course_interest": random.choice(courses),
        "source": random.choice(sources),
        "stage": stage,
        "score": score,
        "organization_id": "default",
        "counselor_id": str(counselor_id) if i % 2 == 0 else None,
        "notes": [],
        "created_at": now - timedelta(days=random.randint(1, 30)),
        "updated_at": now - timedelta(hours=random.randint(1, 24))
    })

db.leads.insert_many(leads_data)

tasks_data = [
    {
        "_id": ObjectId(),
        "title": "Follow up regarding Visa documents",
        "description": "Student needs to upload financial statements.",
        "due_date": now - timedelta(days=1),
        "status": "pending",
        "priority": "high",
        "organization_id": "default",
        "lead_id": str(lead_ids[0]),
        "assigned_to": str(counselor_id),
        "created_at": now - timedelta(days=2)
    },
    {
        "_id": ObjectId(),
        "title": "Send university shortlist",
        "description": "For MBA programs in Canada.",
        "due_date": now + timedelta(hours=4),
        "status": "pending",
        "priority": "medium",
        "organization_id": "default",
        "lead_id": str(lead_ids[1]),
        "assigned_to": str(counselor_id),
        "created_at": now
    },
    {
        "_id": ObjectId(),
        "title": "Welcome call",
        "description": "First contact with new web lead.",
        "due_date": now - timedelta(hours=2),
        "status": "done",
        "priority": "low",
        "organization_id": "default",
        "lead_id": str(lead_ids[2]),
        "assigned_to": str(counselor_id),
        "created_at": now - timedelta(days=1)
    }
]
db.tasks.insert_many(tasks_data)

messages_data = [
    {
        "_id": ObjectId(),
        "lead_id": str(lead_ids[0]),
        "direction": "inbound",
        "content": "Hi, I am interested in applying to universities in the UK. Can you help?",
        "status": "delivered",
        "created_at": now - timedelta(days=1)
    },
    {
        "_id": ObjectId(),
        "lead_id": str(lead_ids[0]),
        "direction": "outbound",
        "content": "Hello! Yes, absolutely. We specialize in UK admissions. What course are you looking for?",
        "status": "read",
        "created_at": now - timedelta(hours=23)
    },
    {
        "_id": ObjectId(),
        "lead_id": str(lead_ids[0]),
        "direction": "inbound",
        "content": "I want to do a Master's in Data Science. Do I need IELTS?",
        "status": "delivered",
        "created_at": now - timedelta(minutes=5)
    }
]
db.messages.insert_many(messages_data)

print(f"✅ Successfully seeded database 'eduflow' with valid ObjectIds")
