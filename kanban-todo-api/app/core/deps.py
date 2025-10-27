from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError
from typing import Optional

from app.database import get_db, user_repository
from app.database.models import User
from .security import verify_token

# HTTP Bearer token scheme
security = HTTPBearer()

def get_current_user(
    db: Session = Depends(get_db),
    token: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Dependency để lấy current user từ JWT token
    Sử dụng trong FastAPI routes với Depends(get_current_user)
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(token.credentials)
        if payload is None:
            raise credentials_exception
        
        user_id: Optional[str] = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    user = user_repository.get(db, id=int(user_id))
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        print(f"🚫 Access denied: User '{user.username}' (ID: {user.id}) is inactive")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."
        )
    
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency để đảm bảo user active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."
        )
    return current_user

def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency để đảm bảo user có quyền admin
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."
        )
    
    # Giả sử có field role trong User model (cần thêm vào model)
    if not hasattr(current_user, 'role') or current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập. Chỉ admin mới được phép."
        )
    
    return current_user

def optional_current_user(
    db: Session = Depends(get_db),
    token: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[User]:
    """
    Optional dependency - không bắt buộc phải có token
    Trả về None nếu không có token hoặc token invalid
    """
    if token is None:
        return None
    
    try:
        payload = verify_token(token.credentials)
        if payload is None:
            return None
        
        user_id = payload.get("user_id")
        if user_id is None:
            return None
        
        user = user_repository.get(db, id=int(user_id))
        return user if user and user.is_active else None
        
    except JWTError:
        return None
