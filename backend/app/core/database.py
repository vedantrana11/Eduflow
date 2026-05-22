from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from loguru import logger
from app.core.config import settings


class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


db_instance = Database()


async def connect_to_mongo():
    """Create database connection and ensure indexes."""
    logger.info(f"Connecting to MongoDB: {settings.MONGODB_URL}")
    db_instance.client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        serverSelectionTimeoutMS=5000,  # 5s timeout — server still boots if DB unreachable
    )
    db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]
    try:
        await create_indexes()
        logger.success("MongoDB connected successfully")
    except Exception as e:
        logger.warning(f"MongoDB not reachable at startup: {e}. Server will start anyway — connect DB to enable all features.")


async def close_mongo_connection():
    """Close database connection."""
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Dependency injection for database."""
    return db_instance.db


async def create_indexes():
    """Create all required MongoDB indexes for performance."""
    db = db_instance.db

    # Users indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("organization_id")

    # Leads indexes
    await db.leads.create_index([("organization_id", 1), ("stage", 1)])
    await db.leads.create_index([("organization_id", 1), ("counselor_id", 1)])
    await db.leads.create_index([("organization_id", 1), ("created_at", -1)])
    await db.leads.create_index("email")
    await db.leads.create_index("phone")
    await db.leads.create_index([("name", "text"), ("email", "text"), ("phone", "text")])

    # Messages indexes
    await db.messages.create_index([("lead_id", 1), ("created_at", -1)])
    await db.messages.create_index("whatsapp_message_id", sparse=True)

    # Tasks indexes
    await db.tasks.create_index([("assigned_to", 1), ("status", 1)])
    await db.tasks.create_index([("lead_id", 1)])
    await db.tasks.create_index("due_date")

    # Activity logs indexes
    await db.activity_logs.create_index([("entity_id", 1), ("timestamp", -1)])
    await db.activity_logs.create_index([("organization_id", 1), ("timestamp", -1)])

    logger.info("Database indexes ensured")
