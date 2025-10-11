from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.user import UserCreate, UserResponse, UserUpdate, PasswordChange
from app.models.mock_data import (
    get_user_by_username, get_user_by_id,
    create_user, update_user, users_db
)

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_new_user(user_data: UserCreate):
    """Tạo user mới"""
    # Kiểm tra username đã tồn tại chưa
    if get_user_by_username(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username đã tồn tại"
        )
    
    # Tạo user mới (chưa hash password, sẽ làm ở buổi sau)
    user_dict = user_data.dict()
    # Tạm thời lưu password thẳng (không an toàn, sẽ sửa ở buổi JWT)
    user = create_user(user_dict)
    return UserResponse(**user)

@router.get("/", response_model=List[UserResponse])
def get_users():
    """Lấy danh sách tất cả users"""
    all_users = list(users_db.values())
    return [UserResponse(**user) for user in all_users]

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    """Lấy thông tin user theo ID"""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )
    return UserResponse(**user)

@router.put("/{user_id}", response_model=UserResponse)
def update_user_info(user_id: int, user_update: UserUpdate):
    """Cập nhật thông tin user"""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )
    
    update_data = user_update.dict(exclude_unset=True)
    if update_data:
        updated_user = update_user(user_id, update_data)
        return UserResponse(**updated_user)
    
    return UserResponse(**user)

@router.patch("/{user_id}/password")
def change_user_password(user_id: int, password_change: PasswordChange):
    """Đổi mật khẩu user"""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )
    
    # Kiểm tra mật khẩu hiện tại (tạm thời so sánh trực tiếp)
    if user["password"] != password_change.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không đúng"
        )
    
    # Cập nhật mật khẩu mới
    update_user(user_id, {"password": password_change.new_password})
    
    return {"message": "Đổi mật khẩu thành công"}

@router.get("/me/{user_id}", response_model=UserResponse)
def get_current_user_info(user_id: int):
    """Lấy thông tin user hiện tại (giả lập /users/me)"""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )
    return UserResponse(**user)
