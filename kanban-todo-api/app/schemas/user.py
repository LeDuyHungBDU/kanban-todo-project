from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None

    @validator('username')
    def username_validator(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError('Username phải có ít nhất 3 ký tự')
        if len(v) > 20:
            raise ValueError('Username không được quá 20 ký tự')
        return v.strip().lower()


class UserCreate(UserBase):
    password: str
    role: Optional[str] = "user"  # Thêm role với default "user"

    @validator('password')
    def password_validator(cls, v):
        if len(v) < 6:
            raise ValueError('Mật khẩu phải có ít nhất 6 ký tự')
        return v
    
    @validator('role')
    def role_validator(cls, v):
        if v not in ["user", "admin"]:
            raise ValueError('Role phải là "user" hoặc "admin"')
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    role: str  # Thêm role vào response
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None  # Chỉ admin mới được update role

    @validator('role')
    def role_validator(cls, v):
        if v is not None and v not in ["user", "admin"]:
            raise ValueError('Role phải là "user" hoặc "admin"')
        return v

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @validator('new_password')
    def new_password_validator(cls, v):
        if len(v) < 6:
            raise ValueError('Mật khẩu mới phải có ít nhất 6 ký tự')
        return v

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse

class TokenPayload(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
    role: Optional[str] = None
