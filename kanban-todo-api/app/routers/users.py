from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List

from app.schemas.user import UserResponse, UserUpdate, PasswordChange
from app.database import get_db, user_repository
from app.database.models import User
from app.core.deps import get_current_user, get_current_admin_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Lấy thông tin user hiện tại"""
    return UserResponse.from_orm(current_user)

@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật thông tin user hiện tại"""
    # User thường không được update role của mình
    update_data = user_update.dict(exclude_unset=True)
    if "role" in update_data and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền thay đổi role"
        )
    
    # Kiểm tra email conflict
    if user_update.email and user_update.email != current_user.email:
        existing_user = user_repository.get_by_email(db, user_update.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email đã được sử dụng"
            )
    
    updated_user = user_repository.update(db, db_obj=current_user, obj_in=update_data)
    return UserResponse.from_orm(updated_user)

@router.patch("/me/password")
def change_current_user_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Đổi mật khẩu user hiện tại"""
    from app.core.security import verify_password
    
    # Kiểm tra mật khẩu hiện tại
    if not verify_password(password_change.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không đúng"
        )
    
    # Cập nhật mật khẩu mới
    user_repository.update_password(db, current_user, password_change.new_password)
    
    return {"message": "Đổi mật khẩu thành công"}

# User list endpoint (accessible by all authenticated users for assignee dropdown)
@router.get("/", response_model=List[UserResponse])
def read_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách tất cả users (for assignee dropdown)"""
    users = user_repository.get_multi(db, skip=skip, limit=limit)
    return [UserResponse.from_orm(user) for user in users]

# Admin-only endpoints

@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: int,
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Lấy thông tin user theo ID (Admin only)"""
    user = user_repository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )
    return UserResponse.from_orm(user)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Cập nhật user bất kỳ (Admin only)"""
    print(f"👤 Updating user {user_id} with data: {user_update.dict(exclude_unset=True)}")
    
    user = user_repository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )
    
    print(f"📊 Current user status - is_active: {user.is_active}")
    
    # Kiểm tra email conflict
    if user_update.email and user_update.email != user.email:
        existing_user = user_repository.get_by_email(db, user_update.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email đã được sử dụng"
            )
    
    updated_user = user_repository.update(db, db_obj=user, obj_in=user_update)
    print(f"✅ User updated - is_active: {updated_user.is_active}, role: {updated_user.role}")
    return UserResponse.from_orm(updated_user)

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    admin_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Xóa user (Admin only)"""
    user = user_repository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )
    
    # Không cho phép admin xóa chính mình
    if user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa tài khoản của chính mình"
        )
    
    user_repository.delete(db, id=user_id)
    return {"message": f"Đã xóa user {user.username}"}
