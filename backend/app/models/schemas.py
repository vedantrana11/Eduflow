from enum import Enum
from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
from bson import ObjectId


# ─── Helpers ────────────────────────────────────────────────────────────────────

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info=None):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError(f"Invalid ObjectId: {v}")


# ─── Enums ──────────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    COUNSELOR = "counselor"


class LeadStage(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    INTERESTED = "interested"
    DOCUMENTS_PENDING = "documents_pending"
    APPLIED = "applied"
    CONVERTED = "converted"
    LOST = "lost"


class MessageDirection(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class MessageType(str, Enum):
    TEXT = "text"
    TEMPLATE = "template"
    VOICE = "voice"
    IMAGE = "image"
    DOCUMENT = "document"


class MessageStatus(str, Enum):
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    OVERDUE = "overdue"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# ─── User Models ────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.COUNSELOR
    organization_id: str = "default"
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserInDB(UserBase):
    password_hash: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Lead Models ────────────────────────────────────────────────────────────────

class LeadNote(BaseModel):
    content: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LeadBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: str
    country_interest: Optional[str] = None
    course_interest: Optional[str] = None
    stage: LeadStage = LeadStage.NEW
    source: Optional[str] = None
    tags: List[str] = []


class LeadCreate(LeadBase):
    counselor_id: Optional[str] = None
    follow_up_date: Optional[datetime] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country_interest: Optional[str] = None
    course_interest: Optional[str] = None
    stage: Optional[LeadStage] = None
    counselor_id: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    score: Optional[int] = Field(None, ge=0, le=100)


class LeadResponse(LeadBase):
    id: str
    counselor_id: Optional[str] = None
    score: int = 0
    notes: List[LeadNote] = []
    whatsapp_thread_id: Optional[str] = None
    last_contacted_at: Optional[datetime] = None
    follow_up_date: Optional[datetime] = None
    organization_id: str
    created_at: datetime
    updated_at: datetime
    counselor_name: Optional[str] = None

    model_config = {"from_attributes": True}


class LeadNoteCreate(BaseModel):
    content: str


# ─── Message Models ─────────────────────────────────────────────────────────────

class MessageBase(BaseModel):
    content: str
    type: MessageType = MessageType.TEXT


class MessageCreate(MessageBase):
    lead_id: str
    template_name: Optional[str] = None
    template_params: Optional[Dict[str, Any]] = None


class MessageResponse(MessageBase):
    id: str
    lead_id: str
    direction: MessageDirection
    whatsapp_message_id: Optional[str] = None
    status: MessageStatus
    sent_by_user_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BulkMessageCreate(BaseModel):
    lead_ids: List[str]
    content: str
    type: MessageType = MessageType.TEXT
    template_name: Optional[str] = None
    scheduled_at: Optional[datetime] = None


# ─── Task Models ────────────────────────────────────────────────────────────────

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: TaskPriority = TaskPriority.MEDIUM


class TaskCreate(TaskBase):
    lead_id: Optional[str] = None
    assigned_to: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to: Optional[str] = None


class TaskResponse(TaskBase):
    id: str
    lead_id: Optional[str] = None
    assigned_to: Optional[str] = None
    status: TaskStatus
    organization_id: str
    created_at: datetime
    lead_name: Optional[str] = None
    assignee_name: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Activity Log Models ─────────────────────────────────────────────────────────

class ActivityLogResponse(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    action: str
    performed_by: str
    performer_name: Optional[str] = None
    metadata: Dict[str, Any] = {}
    timestamp: datetime

    model_config = {"from_attributes": True}


# ─── Auth Models ─────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshRequest(BaseModel):
    refresh_token: str


# ─── Pagination ─────────────────────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


# ─── Analytics Models ───────────────────────────────────────────────────────────

class FunnelData(BaseModel):
    stage: str
    count: int
    percentage: float


class DailyActivity(BaseModel):
    date: str
    leads_added: int
    messages_sent: int
    tasks_completed: int


class CounselorPerformance(BaseModel):
    counselor_id: str
    counselor_name: str
    leads_assigned: int
    leads_converted: int
    conversion_rate: float
    messages_sent: int


class DashboardStats(BaseModel):
    total_leads: int
    new_leads_today: int
    converted_leads: int
    conversion_rate: float
    pending_tasks: int
    overdue_tasks: int
    messages_today: int
    estimated_revenue: float
    funnel: List[FunnelData]
    daily_activity: List[DailyActivity]
    counselor_performance: List[CounselorPerformance]
