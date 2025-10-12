from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List

from app.schemas.user import UserCreate, UserResponse, UserUpdate, PasswordChange
from app.database import get_db, user_repository

router = APIRouter(prefix="/users", tags=["users"])

# API users register
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Tạo user mới"""
    # Kiểm tra username đã tồn tại
    if user_repository.get_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username đã tồn tại"
        )
    
    # Kiểm tra email đã tồn tại (nếu có)
    if user_data.email and user_repository.get_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email đã tồn tại"
        )
    
    user_dict = user_data.dict()
    # Tạm thời lưu password plain text (sẽ hash ở buổi JWT)
    db_user = user_repository.create_user(db, user_dict)
    return UserResponse.from_orm(db_user)


@router.get("/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lấy danh sách users"""
    users = user_repository.get_multi(db, skip=skip, limit=limit)
    return [UserResponse.from_orm(user) for user in users]

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Lấy user theo ID"""
    user = user_repository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )
    return UserResponse.from_orm(user)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Cập nhật user"""
    user = user_repository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )
    
    # Kiểm tra email conflict nếu update email
    if user_update.email and user_update.email != user.email:
        existing_user = user_repository.get_by_email(db, user_update.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email đã được sử dụng"
            )
    
    updated_user = user_repository.update(db, db_obj=user, obj_in=user_update)
    return UserResponse.from_orm(updated_user)

@router.patch("/{user_id}/password")
def change_password(user_id: int, password_change: PasswordChange, db: Session = Depends(get_db)):
    """Đổi mật khẩu user"""
    user = user_repository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )
    
    # Kiểm tra password hiện tại (tạm thời plain text)
    if user.password != password_change.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không đúng"
        )
    
    # Cập nhật password mới
    user_repository.update(db, db_obj=user, obj_in={"password": password_change.new_password})
    return {"message": "Đổi mật khẩu thành công"}

