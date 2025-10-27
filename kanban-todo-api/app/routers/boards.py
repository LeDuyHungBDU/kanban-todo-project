from fastapi import APIRouter, HTTPException, status, Query, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.schemas.board import BoardCreate, BoardResponse, BoardUpdate, BoardWithTasks
from app.schemas.task import TaskResponse
from app.database import get_db, board_repository, task_repository
from app.database.models import User
from app.core.deps import get_current_user, optional_current_user

router = APIRouter(prefix="/boards", tags=["boards"])

@router.get("/", response_model=List[BoardResponse])
def get_boards(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách boards của user hiện tại + public boards (admin xem tất cả)"""
    if current_user.role == "admin":
        boards = board_repository.get_multi(db)
    else:
        # Get owned boards + public boards for regular users
        boards = board_repository.get_accessible_boards(db, current_user.id)
    
    # Pagination
    paginated_boards = boards[skip:skip+limit]
    
    # Thêm tasks_count và owner_name
    response_boards = []
    for board in paginated_boards:
        board_tasks = task_repository.get_by_board(db, board.id)
        board_response = BoardResponse.from_orm(board)
        board_response.tasks_count = len(board_tasks)
        
        # Add owner name
        if board.owner:
            board_response.owner_name = board.owner.full_name or board.owner.username
        
        response_boards.append(board_response)
    
    return response_boards

@router.get("/public", response_model=List[BoardResponse])
def get_public_boards(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: Optional[User] = Depends(optional_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách public boards (không cần authentication)"""
    public_boards = board_repository.get_public_boards(db)
    
    # Pagination
    paginated_boards = public_boards[skip:skip+limit]
    
    response_boards = []
    for board in paginated_boards:
        board_tasks = task_repository.get_by_board(db, board.id)
        board_response = BoardResponse.from_orm(board)
        board_response.tasks_count = len(board_tasks)
        
        # Add owner name
        if board.owner:
            board_response.owner_name = board.owner.full_name or board.owner.username
        
        response_boards.append(board_response)
    
    return response_boards

@router.post("/", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
def create_board(
    board_data: BoardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo board mới"""
    board_dict = board_data.dict()
    board_dict["owner_id"] = current_user.id
    
    print(f"📝 Creating board with data: {board_dict}")
    print(f"📝 Description value: '{board_dict.get('description')}' (type: {type(board_dict.get('description'))})")
    
    board = board_repository.create(db, obj_in=board_dict)
    
    print(f"✅ Board created with ID: {board.id}, description: '{board.description}'")
    
    board_response = BoardResponse.from_orm(board)
    board_response.tasks_count = 0
    board_response.owner_name = current_user.full_name or current_user.username
    return board_response

@router.get("/{board_id}", response_model=BoardWithTasks)
def get_board_detail(
    board_id: int,
    current_user: Optional[User] = Depends(optional_current_user),
    db: Session = Depends(get_db)
):
    """Lấy chi tiết board kèm tasks"""
    board = board_repository.get(db, board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board không tồn tại"
        )
    
    # Kiểm tra quyền truy cập
    can_access = (
        board.is_public or  # Public board
        (current_user and (
            board.owner_id == current_user.id or  # Owner
            current_user.role == "admin"  # Admin
        ))
    )
    
    if not can_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập board này"
        )
    
    tasks = task_repository.get_by_board(db, board_id)
    task_responses = [TaskResponse.from_orm(task) for task in tasks]
    
    board_response = BoardWithTasks.from_orm(board)
    board_response.tasks = task_responses
    return board_response

@router.put("/{board_id}", response_model=BoardResponse)
def update_board(
    board_id: int,
    board_update: BoardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật board (chỉ owner hoặc admin)"""
    board = board_repository.get(db, board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board không tồn tại"
        )
    
    # Kiểm tra ownership
    if board.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền chỉnh sửa board này"
        )
    
    print(f"📝 Updating board {board_id} with data: {board_update.dict(exclude_unset=True)}")
    print(f"📝 Description value: '{board_update.description}' (type: {type(board_update.description)})")
    
    updated_board = board_repository.update(db, db_obj=board, obj_in=board_update)
    
    print(f"✅ Board updated, new description: '{updated_board.description}'")
    
    tasks = task_repository.get_by_board(db, board_id)
    board_response = BoardResponse.from_orm(updated_board)
    board_response.tasks_count = len(tasks)
    
    # Add owner name
    if updated_board.owner:
        board_response.owner_name = updated_board.owner.full_name or updated_board.owner.username
    
    return board_response

@router.delete("/{board_id}")
def delete_board(
    board_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa board (chỉ owner hoặc admin)"""
    board = board_repository.get(db, board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board không tồn tại"
        )
    
    # Kiểm tra ownership
    if board.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền xóa board này"
        )
    
    tasks = task_repository.get_by_board(db, board_id)
    deleted_tasks_count = len(tasks)
    
    board_repository.delete(db, id=board_id)
    
    return {
        "message": f"Đã xóa board '{board.name}'",
        "deleted_tasks_count": deleted_tasks_count
    }
