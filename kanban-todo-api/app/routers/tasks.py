from fastapi import APIRouter, HTTPException, status, Query, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate, TaskMove, TaskAssign
from app.database import get_db, task_repository, board_repository, user_repository
from app.database.models import StatusEnum

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    board_id: int = Query(..., description="ID của board"),
    status: Optional[str] = Query(None, description="Filter theo status"),
    priority: Optional[str] = Query(None, description="Filter theo priority"),
    assigned_to: Optional[int] = Query(None, description="Filter theo assigned user"),
    db: Session = Depends(get_db)
):
    """Lấy tasks với filters"""
    # Kiểm tra board tồn tại
    board = board_repository.get(db, board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board không tồn tại"
        )
    
    # Get tasks với filters
    if status:
        try:
            status_enum = StatusEnum(status)
            tasks = task_repository.get_by_status(db, board_id, status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
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
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    """Tạo task mới"""
    # Kiểm tra board tồn tại
    board = board_repository.get(db, task_data.board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Board không tồn tại"
        )
    
    # Tính position cho task mới
    existing_tasks = task_repository.get_by_status(db, task_data.board_id, task_data.status)
    task_dict = task_data.dict()
    task_dict["position"] = len(existing_tasks)
    
    task = task_repository.create(db, obj_in=task_dict)
    return TaskResponse.from_orm(task)

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Lấy task theo ID"""
    task = task_repository.get(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    return TaskResponse.from_orm(task)

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    """Cập nhật task"""
    task = task_repository.get(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    
    updated_task = task_repository.update(db, db_obj=task, obj_in=task_update)
    return TaskResponse.from_orm(updated_task)

@router.patch("/{task_id}/move", response_model=TaskResponse)
def move_task(task_id: int, task_move: TaskMove, db: Session = Depends(get_db)):
    """Di chuyển task"""
    moved_task = task_repository.move_task(db, task_id, task_move.status, task_move.position)
    if not moved_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    return TaskResponse.from_orm(moved_task)

@router.patch("/{task_id}/assign", response_model=TaskResponse)
def assign_task(task_id: int, task_assign: TaskAssign, db: Session = Depends(get_db)):
    """Gán task cho user"""
    task = task_repository.get(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    
    # Kiểm tra user tồn tại nếu có assigned_to
    if task_assign.assigned_to:
        user = user_repository.get(db, task_assign.assigned_to)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User được gán không tồn tại"
            )
    
    updated_task = task_repository.update(db, db_obj=task, obj_in={"assigned_to": task_assign.assigned_to})
    return TaskResponse.from_orm(updated_task)

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Xóa task"""
    task = task_repository.get(db, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    
    task_repository.delete(db, id=task_id)
    return {
        "message": "Xóa task thành công",
        "deleted_task_id": task_id
    }

@router.get("/search/", response_model=List[TaskResponse])
def search_tasks(
    q: str = Query(..., min_length=1, description="Từ khóa tìm kiếm"),
    board_id: Optional[int] = Query(None, description="Tìm trong board cụ thể"),
    db: Session = Depends(get_db)
):
    """Tìm kiếm tasks"""
    if board_id:
        board = board_repository.get(db, board_id)
        if not board:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Board không tồn tại"
            )
    
    tasks = task_repository.search_tasks(db, q, board_id)
    return [TaskResponse.from_orm(task) for task in tasks]

