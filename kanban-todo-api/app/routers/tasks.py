from fastapi import APIRouter, HTTPException, status, Query, Depends
from starlette import status as starlette_status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate, TaskMove, TaskAssign
from app.database import get_db, task_repository, board_repository, user_repository
from app.database.models import StatusEnum, User
from app.core.deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])

def check_board_access(
    db: Session, 
    board_id: int, 
    user: User, 
    action: str = "read"
) -> bool:
    """Helper function để kiểm tra quyền truy cập board"""
    board = board_repository.get(db, board_id)
    if not board:
        return False
    
    # Admin có full access
    if user.role == "admin":
        return True
    
    # Owner có full access
    if board.owner_id == user.id:
        return True
    
    # Public board chỉ cho phép read
    if board.is_public and action == "read":
        return True
    
    return False

@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    board_id: int = Query(..., description="ID của board"),
    status: Optional[str] = Query(None, description="Filter theo status"),
    priority: Optional[str] = Query(None, description="Filter theo priority"),
    assigned_to: Optional[int] = Query(None, description="Filter theo assigned user"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy tasks với filters"""
    # Kiểm tra board tồn tại
    board = board_repository.get(db, board_id)
    if not board:
        raise HTTPException(
            status_code=starlette_status.HTTP_404_NOT_FOUND,
            detail="Board không tồn tại"
        )

    # Kiểm tra quyền truy cập board
    if not check_board_access(db, board_id, current_user, "read"):
        raise HTTPException(
            status_code=starlette_status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập board này"
        )
    
    # Get tasks với filters
    if status:
        try:
            status_enum = StatusEnum(status)
            tasks = task_repository.get_by_status(db, board_id, status_enum)
        except ValueError:
            raise HTTPException(
                status_code=starlette_status.HTTP_400_BAD_REQUEST,
                detail=f"Status không hợp lệ: {status}"
            )
    else:
        tasks = task_repository.get_by_board(db, board_id)
    
    # Apply additional filters
    if priority:
        tasks = [task for task in tasks if task.priority.value == priority]
    
    if assigned_to is not None:
        tasks = [task for task in tasks if task.assigned_to == assigned_to]
    
    return [TaskResponse.from_orm(task) for task in tasks]

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo task mới"""
    # Kiểm tra quyền tạo task trong board
    if not check_board_access(db, task_data.board_id, current_user, "write"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền tạo task trong board này"
        )
    
    # Tính position cho task mới
    existing_tasks = task_repository.get_by_status(db, task_data.board_id, task_data.status)
    task_dict = task_data.dict()
    task_dict["position"] = len(existing_tasks)
    
    task = task_repository.create(db, obj_in=task_dict)
    return TaskResponse.from_orm(task)

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy task theo ID"""
    task = task_repository.get(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    
    # Kiểm tra quyền truy cập
    if not check_board_access(db, task.board_id, current_user, "read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập task này"
        )
    
    return TaskResponse.from_orm(task)

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật task"""
    task = task_repository.get(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    
    # Kiểm tra quyền chỉnh sửa
    if not check_board_access(db, task.board_id, current_user, "write"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền chỉnh sửa task này"
        )
    
    updated_task = task_repository.update(db, db_obj=task, obj_in=task_update)
    return TaskResponse.from_orm(updated_task)

@router.patch("/{task_id}/move", response_model=TaskResponse)
def move_task(
    task_id: int,
    task_move: TaskMove,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Di chuyển task"""
    task = task_repository.get(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    
    # Kiểm tra quyền di chuyển
    if not check_board_access(db, task.board_id, current_user, "write"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền di chuyển task này"
        )
    
    moved_task = task_repository.move_task(db, task_id, task_move.status, task_move.position)
    return TaskResponse.from_orm(moved_task)

@router.patch("/{task_id}/assign", response_model=TaskResponse)
def assign_task(
    task_id: int,
    task_assign: TaskAssign,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gán task cho user"""
    task = task_repository.get(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    
    # Kiểm tra quyền assign
    if not check_board_access(db, task.board_id, current_user, "write"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền assign task này"
        )
    
    # Kiểm tra user được assign có tồn tại
    if task_assign.assigned_to:
        assigned_user = user_repository.get(db, task_assign.assigned_to)
        if not assigned_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User được assign không tồn tại"
            )
        
        if not assigned_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User được assign đã bị vô hiệu hóa"
            )
    
    updated_task = task_repository.update(
        db, 
        db_obj=task, 
        obj_in={"assigned_to": task_assign.assigned_to}
    )
    return TaskResponse.from_orm(updated_task)

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa task"""
    task = task_repository.get(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    
    # Kiểm tra quyền xóa
    if not check_board_access(db, task.board_id, current_user, "write"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền xóa task này"
        )
    
    task_repository.delete(db, id=task_id)
    return {
        "message": f"Đã xóa task '{task.title}'",
        "deleted_task_id": task_id
    }

@router.get("/my/assigned", response_model=List[TaskResponse])
def get_my_assigned_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy tất cả tasks được assign cho user hiện tại (admin xem tất cả)"""
    if current_user.role == "admin":
        tasks = task_repository.get_multi(db)  # Admin xem tất cả tasks
    else:
        tasks = task_repository.get_by_assigned_user(db, current_user.id)
    return [TaskResponse.from_orm(task) for task in tasks]
