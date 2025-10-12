from fastapi import APIRouter, HTTPException, status, Query, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.schemas.board import BoardCreate, BoardResponse, BoardUpdate, BoardWithTasks
from app.schemas.task import TaskResponse
from app.database import get_db, board_repository, task_repository, user_repository

router = APIRouter(prefix="/boards", tags=["boards"])

@router.get("/", response_model=List[BoardResponse])
def get_boards(
    owner_id: Optional[int] = Query(None, description="Filter theo owner"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Lấy danh sách boards"""
    if owner_id:
        boards = board_repository.get_by_owner(db, owner_id)
    else:
        boards = board_repository.get_multi(db, skip=skip, limit=limit)
    
    # Thêm tasks_count
    response_boards = []
    for board in boards:
        board_tasks = task_repository.get_by_board(db, board.id)
        board_response = BoardResponse.from_orm(board)
        board_response.tasks_count = len(board_tasks)
        response_boards.append(board_response)
    
    return response_boards

@router.post("/", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
def create_board(
    board_data: BoardCreate,
    owner_id: int = Query(..., description="ID của user tạo board"),
    db: Session = Depends(get_db)
):
    """Tạo board mới"""
    # Kiểm tra user có tồn tại không
    owner = user_repository.get(db, owner_id)
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User không tồn tại"
        )
    
    board_dict = board_data.dict()
    board_dict["owner_id"] = owner_id
    
    board = board_repository.create(db, obj_in=board_dict)
    board_response = BoardResponse.from_orm(board)
    board_response.tasks_count = 0
    return board_response

@router.get("/{board_id}", response_model=BoardWithTasks)
def get_board_detail(board_id: int, db: Session = Depends(get_db)):
    """Lấy chi tiết board kèm tasks"""
    board = board_repository.get(db, board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board không tồn tại"
        )
    
    tasks = task_repository.get_by_board(db, board_id)
    task_responses = [TaskResponse.from_orm(task) for task in tasks]
    
    board_response = BoardWithTasks.from_orm(board)
    board_response.tasks = task_responses
    return board_response

@router.put("/{board_id}", response_model=BoardResponse)
def update_board(board_id: int, board_update: BoardUpdate, db: Session = Depends(get_db)):
    """Cập nhật board"""
    board = board_repository.get(db, board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board không tồn tại"
        )
    
    updated_board = board_repository.update(db, db_obj=board, obj_in=board_update)
    
    # Thêm tasks_count
    tasks = task_repository.get_by_board(db, board_id)
    board_response = BoardResponse.from_orm(updated_board)
    board_response.tasks_count = len(tasks)
    return board_response

@router.delete("/{board_id}")
def delete_board(board_id: int, db: Session = Depends(get_db)):
    """Xóa board và tất cả tasks"""
    board = board_repository.get(db, board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board không tồn tại"
        )
    
    # Đếm tasks sẽ bị xóa
    tasks = task_repository.get_by_board(db, board_id)
    deleted_tasks_count = len(tasks)
    
    # Xóa board (cascade sẽ tự động xóa tasks)
    board_repository.delete(db, id=board_id)
    
    return {
        "message": "Xóa board thành công",
        "deleted_tasks_count": deleted_tasks_count
    }

