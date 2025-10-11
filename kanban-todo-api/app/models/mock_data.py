from datetime import datetime, timedelta
from typing import Dict, List, Optional

# Mock databases - dictionary lưu trữ dữ liệu trong memory
users_db: Dict[int, dict] = {}
boards_db: Dict[int, dict] = {}
tasks_db: Dict[int, dict] = {}

# Auto-increment IDs
next_user_id = 1
next_board_id = 1
next_task_id = 1

def init_sample_data():
    """Khởi tạo dữ liệu mẫu để test"""
    global next_user_id, next_board_id, next_task_id
    
    # Tạo sample users
    sample_users = [
        {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "password": "admin123",  # Thực tế sẽ hash password
            "full_name": "Administrator",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 2,
            "username": "johndoe", 
            "email": "john@example.com",
            "password": "password123",
            "full_name": "John Doe",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    for user in sample_users:
        users_db[user["id"]] = user
    next_user_id = 3
    
# Tạo sample boards
    sample_boards = [
        {
            "id": 1,
            "name": "Personal Tasks",
            "description": "Quản lý công việc cá nhân",
            "owner_id": 2,
            "is_public": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 2,
            "name": "Work Project",
            "description": "Dự án công ty",
            "owner_id": 2,
            "is_public": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    for board in sample_boards:
        boards_db[board["id"]] = board
    next_board_id = 3
    
# Tạo sample tasks
    sample_tasks = [
        {
            "id": 1,
            "title": "Setup development environment",
            "description": "Cài đặt Python, FastAPI, và các công cụ cần thiết",
            "status": "todo",
            "priority": "high",
            "position": 0,
            "board_id": 1,
            "assigned_to": 2,
            "due_date": datetime.utcnow() + timedelta(days=3),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 2,
            "title": "Thiết kế API endpoints",
            "description": "Tạo specification cho tất cả API",
            "status": "done",
            "priority": "high", 
            "position": 0,
            "board_id": 1,
            "assigned_to": 2,
            "due_date": None,
            "created_at": datetime.utcnow() - timedelta(days=2),
            "updated_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "id": 3,
            "title": "Implement FastAPI",
            "description": "Viết code cho các API endpoints",
            "status": "in_progress",
            "priority": "medium",
            "position": 0,
            "board_id": 2,
            "assigned_to": 2,
            "due_date": datetime.utcnow() + timedelta(days=5),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    for task in sample_tasks:
        tasks_db[task["id"]] = task
    next_task_id = 4

# Helper functions cho User operations
def get_user_by_username(username: str) -> Optional[dict]:
    """Tìm user theo username"""
    for user in users_db.values():
        if user["username"] == username:
            return user
    return None

def get_user_by_id(user_id: int) -> Optional[dict]:
    """Tìm user theo ID"""
    return users_db.get(user_id)

def create_user(user_data: dict) -> dict:
    """Tạo user mới"""
    global next_user_id
    user = {
        "id": next_user_id,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        **user_data  # Spread operator - giải nén tất cả key-value từ user_data
    }
    users_db[next_user_id] = user
    next_user_id += 1
    return user

def update_user(user_id: int, updates: dict) -> Optional[dict]:
    """Cập nhật thông tin user"""
    if user_id in users_db:
        users_db[user_id].update(updates)
        users_db[user_id]["updated_at"] = datetime.utcnow()
        return users_db[user_id]
    return None

# Helper functions cho Board operations  
def get_all_boards() -> List[dict]:
    """Lấy tất cả boards"""
    return list(boards_db.values())

def get_board_by_id(board_id: int) -> Optional[dict]:
    """Tìm board theo ID"""
    return boards_db.get(board_id)

def create_board(board_data: dict) -> dict:
    """Tạo board mới"""
    global next_board_id
    board = {
        "id": next_board_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        **board_data
    }
    boards_db[next_board_id] = board
    next_board_id += 1
    return board

def update_board(board_id: int, updates: dict) -> Optional[dict]:
    """Cập nhật board"""
    if board_id in boards_db:
        boards_db[board_id].update(updates)
        boards_db[board_id]["updated_at"] = datetime.utcnow()
        return boards_db[board_id]
    return None

def delete_board(board_id: int) -> bool:
    """Xóa board và tất cả tasks trong board đó"""
    if board_id in boards_db:
        # Xóa tất cả tasks thuộc board này
        task_ids_to_delete = [
            task_id for task_id, task in tasks_db.items() 
            if task["board_id"] == board_id
        ]
        for task_id in task_ids_to_delete:
            del tasks_db[task_id]
        
        # Xóa board
        del boards_db[board_id]
        return True
    return False

# Helper functions cho Task operations
def get_tasks_by_board(
    board_id: int, 
    status: Optional[str] = None, 
    priority: Optional[str] = None
) -> List[dict]:
    """Lấy tasks theo board, có thể filter theo status và priority"""
    tasks = [task for task in tasks_db.values() if task["board_id"] == board_id]
    
    if status:
        tasks = [task for task in tasks if task["status"] == status]
    
    if priority:
        tasks = [task for task in tasks if task["priority"] == priority]
    
    # Sắp xếp theo position, sau đó theo created_at
    tasks.sort(key=lambda x: (x["position"], x["created_at"]))
    return tasks

def get_task_by_id(task_id: int) -> Optional[dict]:
    """Tìm task theo ID"""
    return tasks_db.get(task_id)

def create_task(task_data: dict) -> dict:
    """Tạo task mới"""
    global next_task_id
    
    # Tính position tiếp theo cho status này
    board_tasks = get_tasks_by_board(task_data["board_id"], task_data["status"])
    next_position = len(board_tasks)
    
    task = {
        "id": next_task_id,
        "position": next_position,
        "assigned_to": None,
        "due_date": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        **task_data
    }
    tasks_db[next_task_id] = task
    next_task_id += 1
    return task

def update_task(task_id: int, updates: dict) -> Optional[dict]:
    """Cập nhật task"""
    if task_id in tasks_db:
        tasks_db[task_id].update(updates)
        tasks_db[task_id]["updated_at"] = datetime.utcnow()
        return tasks_db[task_id]
    return None

def delete_task(task_id: int) -> bool:
    """Xóa task"""
    if task_id in tasks_db:
        del tasks_db[task_id]
        return True
    return False

def move_task(task_id: int, new_status: str, new_position: Optional[int] = None) -> Optional[dict]:
    """Di chuyển task sang status mới và/hoặc position mới"""
    if task_id not in tasks_db:
        return None
    
    task = tasks_db[task_id]
    old_status = task["status"]
    
    # Nếu chuyển sang status khác, tính position mới
    if new_status != old_status:
        if new_position is None:
            # Chuyển xuống cuối danh sách status mới
            same_status_tasks = get_tasks_by_board(task["board_id"], new_status)
            new_position = len(same_status_tasks)
    
    updates = {"status": new_status}
    if new_position is not None:
        updates["position"] = new_position
    
    return update_task(task_id, updates)

def search_tasks(query: str, board_id: Optional[int] = None) -> List[dict]:
    """Tìm kiếm tasks theo từ khóa"""
    all_tasks = list(tasks_db.values())
    
    if board_id:
        all_tasks = [task for task in all_tasks if task["board_id"] == board_id]
    
    # Tìm trong title và description
    search_query = query.lower()
    matching_tasks = []
    
    for task in all_tasks:
        if (search_query in task["title"].lower() or 
            (task["description"] and search_query in task["description"].lower())):
            matching_tasks.append(task)
    
    return matching_tasks

# Khởi tạo dữ liệu mẫu khi import module
init_sample_data()

