from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId
from app.models.schemas import (
    UserCreate, LoginRequest, TokenResponse, RefreshRequest, UserResponse
)
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token, decode_token,
    get_current_user
)
from app.core.database import get_database
from app.utils.helpers import serialize_doc, log_activity

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserCreate, db=Depends(get_database)):
    """Register a new user."""
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    now = datetime.utcnow()
    user_doc = {
        "email": payload.email,
        "name": payload.name,
        "role": payload.role,
        "organization_id": payload.organization_id,
        "avatar_url": payload.avatar_url,
        "password_hash": get_password_hash(payload.password),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    user_data = serialize_doc(user_doc)

    access_token = create_access_token({"sub": user_data["id"], "role": user_data["role"]})
    refresh_token = create_refresh_token({"sub": user_data["id"]})

    await log_activity(
        db,
        entity_type="user",
        entity_id=user_data["id"],
        action="user_registered",
        performed_by=user_data["id"],
        organization_id=user_data["organization_id"],
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(**user_data),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db=Depends(get_database)):
    """Authenticate with email and password."""
    user = await db.users.find_one({"email": payload.email, "is_active": True})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_data = serialize_doc(user)
    access_token = create_access_token({"sub": user_data["id"], "role": user_data["role"]})
    refresh_token = create_refresh_token({"sub": user_data["id"]})

    await log_activity(
        db,
        entity_type="user",
        entity_id=user_data["id"],
        action="user_login",
        performed_by=user_data["id"],
        organization_id=user_data.get("organization_id", "default"),
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(**user_data),
    )


@router.post("/refresh")
async def refresh_token(payload: RefreshRequest, db=Depends(get_database)):
    """Issue new access token using refresh token."""
    token_data = decode_token(payload.refresh_token)
    if token_data.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Invalid refresh token")

    user_id = token_data.get("sub")
    user = await db.users.find_one({"_id": ObjectId(user_id), "is_active": True})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    user_data = serialize_doc(user)
    access_token = create_access_token({"sub": user_data["id"], "role": user_data["role"]})

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    """Get the currently authenticated user."""
    return UserResponse(**current_user)


@router.put("/me")
async def update_me(
    payload: dict,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Update current user profile."""
    allowed_fields = {"name", "avatar_url"}
    update_data = {k: v for k, v in payload.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.utcnow()

    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_data},
    )
    updated_user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    return serialize_doc(updated_user)
