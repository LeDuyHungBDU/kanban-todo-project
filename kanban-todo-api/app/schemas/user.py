from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None

    @validator('username')
    def username_must_be_valid(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError('Username phải có ít nhất 3 ký tự')
        if len(v) > 20:
            raise ValueError('Username không được quá 20 ký tự')
        return v.strip().lower()

class UserCreate(UserBase):
    password: str

    @validator('password')
    def password_must_be_strong(cls, v):
        if len(v) < 6:
            raise ValueError('Mật khẩu phải có ít nhất 6 ký tự')
        return v

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        # Cho phép chuyển đổi từ dict sang Pydantic model
        orm_mode = True

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @validator('new_password')
    def new_password_must_be_strong(cls, v):
        if len(v) < 6:
            raise ValueError('Mật khẩu mới phải có ít nhất 6 ký tự')
        return v

