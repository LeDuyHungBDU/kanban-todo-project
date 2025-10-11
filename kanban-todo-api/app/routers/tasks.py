from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate, TaskMove, TaskAssign
from app.models.mock_data import (
    get_tasks_by_board, get_task_by_id, create_task, 
    update_task, delete_task, move_task, search_tasks,
    get_board_by_id
)

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    board_id: int = Query(..., description="ID của board"),
    status: Optional[str] = Query(None, description="Lọc theo status"),
    priority: Optional[str] = Query(None, description="Lọc theo priority"),
    assigned_to: Optional[int] = Query(None, description="Lọc theo user được gán")
):
    """Lấy danh sách tasks theo board với các filter options"""
    # Kiểm tra board có tồn tại không
    board = get_board_by_id(board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board không tồn tại"
        )
    
    tasks = get_tasks_by_board(board_id, status, priority)
    
    # Filter theo assigned_to nếu có
    if assigned_to is not None:
        tasks = [task for task in tasks if task["assigned_to"] == assigned_to]
    
    return [TaskResponse(**task) for task in tasks]

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_new_task(task_data: TaskCreate):
    """Tạo task mới"""
    # Kiểm tra board có tồn tại không
    board = get_board_by_id(task_data.board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Board không tồn tại"
        )
    
    task_dict = task_data.dict()
    task = create_task(task_dict)
    return TaskResponse(**task)

@router.get("/{task_id}", response_model=TaskResponse)
def get_task_detail(task_id: int):
    """Lấy chi tiết task"""
    task = get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    return TaskResponse(**task)

@router.put("/{task_id}", response_model=TaskResponse)
def update_task_info(task_id: int, task_update: TaskUpdate):
    """Cập nhật thông tin task"""
    task = get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    
    update_data = task_update.dict(exclude_unset=True)
    if update_data:
        updated_task = update_task(task_id, update_data)
        return TaskResponse(**updated_task)
    
    return TaskResponse(**task)

@router.patch("/{task_id}/move", response_model=TaskResponse)
def move_task_status(task_id: int, task_move: TaskMove):
    """Di chuyển task sang status/position mới"""
    task = get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    
    moved_task = move_task(task_id, task_move.status.value, task_move.position)
    if not moved_task:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể di chuyển task"
        )
    
    return TaskResponse(**moved_task)

@router.patch("/{task_id}/assign", response_model=TaskResponse)
def assign_task_to_user(task_id: int, task_assign: TaskAssign):
    """Gán task cho user"""
    task = get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    
    # Nếu có assigned_to, kiểm tra user có tồn tại không (optional)
    # if task_assign.assigned_to:
    #     user = get_user_by_id(task_assign.assigned_to)
    #     if not user:
    #         raise HTTPException(400, "User không tồn tại")
    
    updated_task = update_task(task_id, {"assigned_to": task_assign.assigned_to})
    return TaskResponse(**updated_task)

@router.delete("/{task_id}")
def delete_task_by_id(task_id: int):
    """Xóa task"""
    task = get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task không tồn tại"
        )
    
    if delete_task(task_id):
        return {
            "message": "Xóa task thành công",
            "deleted_task_id": task_id
        }
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Không thể xóa task"
    )

@router.get("/search/", response_model=List[TaskResponse])
def search_tasks_by_keyword(
    q: str = Query(..., min_length=1, description="Từ khóa tìm kiếm"),
    board_id: Optional[int] = Query(None, description="Tìm kiếm trong board cụ thể")
):
    """Tìm kiếm tasks theo từ khóa trong title hoặc description"""
    if board_id:
        # Kiểm tra board có tồn tại không
        board = get_board_by_id(board_id)
        if not board:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Board không tồn tại"
            )
    
    matching_tasks = search_tasks(q, board_id)
    return [TaskResponse(**task) for task in matching_tasks]

