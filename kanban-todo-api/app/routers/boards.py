from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from app.schemas.board import BoardCreate, BoardResponse, BoardUpdate, BoardWithTasks
from app.schemas.task import TaskResponse
from app.models.mock_data import (
    get_all_boards, get_board_by_id, create_board, 
    update_board, delete_board, get_tasks_by_board
)

router = APIRouter(prefix="/boards", tags=["boards"])

@router.get("/", response_model=List[BoardResponse])
def get_boards(
    page: int = Query(1, ge=1, description="Trang hiện tại"),
    limit: int = Query(10, ge=1, le=100, description="Số lượng boards mỗi trang")
):
    """Lấy danh sách boards với pagination"""
    boards = get_all_boards()
    
    # Pagination đơn giản
    start = (page - 1) * limit
    end = start + limit
    paginated_boards = boards[start:end]
    
    # Thêm tasks_count cho mỗi board
    response_boards = []
    for board in paginated_boards:
        board_tasks = get_tasks_by_board(board["id"])
        board_response = BoardResponse(**board)
        board_response.tasks_count = len(board_tasks)
        response_boards.append(board_response)
    
    return response_boards

@router.post("/", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
def create_new_board(
    board_data: BoardCreate,
    owner_id: int = Query(..., description="ID của user tạo board")
):
    """Tạo board mới"""
    # Tạm thời dùng query parameter để biết ai tạo board
    # Sau này sẽ lấy từ JWT token
    board_dict = board_data.dict()
    board_dict["owner_id"] = owner_id
    
    board = create_board(board_dict)
    board_response = BoardResponse(**board)
    board_response.tasks_count = 0
    return board_response

@router.get("/{board_id}", response_model=BoardWithTasks)
def get_board_detail(board_id: int):
    """Lấy chi tiết board kèm tasks"""
    board = get_board_by_id(board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board không tồn tại"
        )
    
    # Lấy tất cả tasks trong board
    tasks = get_tasks_by_board(board_id)
    task_responses = [TaskResponse(**task) for task in tasks]
    
    board_response = BoardWithTasks(**board)
    board_response.tasks = task_responses
    return board_response

@router.put("/{board_id}", response_model=BoardResponse)
def update_board_info(board_id: int, board_update: BoardUpdate):
    """Cập nhật thông tin board"""
    board = get_board_by_id(board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board không tồn tại"
        )
    
    update_data = board_update.dict(exclude_unset=True)
    if update_data:
        updated_board = update_board(board_id, update_data)
        board_response = BoardResponse(**updated_board)
        tasks = get_tasks_by_board(board_id)
        board_response.tasks_count = len(tasks)
        return board_response
    
    board_response = BoardResponse(**board)
    tasks = get_tasks_by_board(board_id)
    board_response.tasks_count = len(tasks)
    return board_response

@router.delete("/{board_id}")
def delete_board_and_tasks(board_id: int):
    """Xóa board và tất cả tasks trong board"""
    board = get_board_by_id(board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board không tồn tại"
        )
    
    # Đếm số tasks sẽ bị xóa
    tasks = get_tasks_by_board(board_id)
    deleted_tasks_count = len(tasks)
    
    # Xóa board (sẽ tự động xóa tasks trong mock_data.py)
    if delete_board(board_id):
        return {
            "message": "Xóa board thành công",
            "deleted_tasks_count": deleted_tasks_count
        }
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Không thể xóa board"
    )

@router.get("/{board_id}/stats")
def get_board_statistics(board_id: int):
    """Lấy thống kê tasks trong board"""
    board = get_board_by_id(board_id)
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board không tồn tại"
        )
    
    all_tasks = get_tasks_by_board(board_id)
    
    # Thống kê theo status
    todo_count = len([t for t in all_tasks if t["status"] == "todo"])
    in_progress_count = len([t for t in all_tasks if t["status"] == "in_progress"])
    done_count = len([t for t in all_tasks if t["status"] == "done"])
    
    # Thống kê theo priority
    high_priority_count = len([t for t in all_tasks if t["priority"] == "high"])
    medium_priority_count = len([t for t in all_tasks if t["priority"] == "medium"])
    low_priority_count = len([t for t in all_tasks if t["priority"] == "low"])
    
    return {
        "board_id": board_id,
        "board_name": board["name"],
        "total_tasks": len(all_tasks),
        "status_stats": {
            "todo": todo_count,
            "in_progress": in_progress_count,
            "done": done_count
        },
        "priority_stats": {
            "high": high_priority_count,
            "medium": medium_priority_count,
            "low": low_priority_count
        }
    }

