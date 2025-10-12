import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, User, Board, Task, StatusEnum, PriorityEnum
from datetime import datetime, timedelta

def seed_data():
    """Tạo dữ liệu mẫu trong database"""
    db = SessionLocal()
    
    try:
        # Tạo users
        users_data = [
            {
                "username": "admin",
                "email": "admin@example.com", 
                "password": "admin123",
                "full_name": "Administrator",
                "is_active": True
            },
            {
                "username": "johndoe",
                "email": "john@example.com",
                "password": "password123", 
                "full_name": "John Doe",
                "is_active": True
            },
            {
                "username": "janesmith", 
                "email": "jane@example.com",
                "password": "password123",
                "full_name": "Jane Smith",
                "is_active": True
            }
        ]
        
        db_users = []
        for user_data in users_data:
            # Kiểm tra user đã tồn tại chưa
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            if not existing_user:
                db_user = User(**user_data)
                db.add(db_user)
                db.commit()
                db.refresh(db_user)
                db_users.append(db_user)
                print(f"Created user: {db_user.username}")
            else:
                db_users.append(existing_user)
                print(f"User already exists: {existing_user.username}")
        
        # Tạo boards
        boards_data = [
            {
                "name": "Personal Tasks",
                "description": "Quản lý công việc cá nhân",
                "is_public": False,
                "owner_id": db_users[1].id  # johndoe
            },
            {
                "name": "Work Project",
                "description": "Dự án công ty",
                "is_public": True,
                "owner_id": db_users[1].id  # johndoe
            },
            {
                "name": "Home Renovation",
                "description": "Sửa chữa nhà cửa",
                "is_public": False,
                "owner_id": db_users[2].id  # janesmith
            }
        ]
        
        db_boards = []
        for board_data in boards_data:
            existing_board = db.query(Board).filter(
                Board.name == board_data["name"],
                Board.owner_id == board_data["owner_id"]
            ).first()
            
            if not existing_board:
                db_board = Board(**board_data)
                db.add(db_board)
                db.commit()
                db.refresh(db_board)
                db_boards.append(db_board)
                print(f"Created board: {db_board.name}")
            else:
                db_boards.append(existing_board)
                print(f"Board already exists: {existing_board.name}")
        
        # Tạo tasks
        tasks_data = [
            {
                "title": "Setup development environment",
                "description": "Cài đặt Python, FastAPI, PostgreSQL",
                "status": StatusEnum.done,
                "priority": PriorityEnum.high,
                "position": 0,
                "board_id": db_boards[0].id,
                "assigned_to": db_users[1].id,
                "due_date": datetime.utcnow() - timedelta(days=1)
            },
            {
                "title": "Design database schema", 
                "description": "Thiết kế ERD và relationships",
                "status": StatusEnum.done,
                "priority": PriorityEnum.high,
                "position": 1,
                "board_id": db_boards[0].id,
                "assigned_to": db_users[1].id
            },
            {
                "title": "Implement SQLAlchemy models",
                "description": "Tạo User, Board, Task models",
                "status": StatusEnum.in_progress,
                "priority": PriorityEnum.medium,
                "position": 0,
                "board_id": db_boards[0].id,
                "assigned_to": db_users[1].id,
                "due_date": datetime.utcnow() + timedelta(days=2)
            },
            {
                "title": "Write API tests",
                "description": "Unit tests cho tất cả endpoints",
                "status": StatusEnum.todo,
                "priority": PriorityEnum.low,
                "position": 0,
                "board_id": db_boards[0].id
            },
            {
                "title": "Setup CI/CD pipeline",
                "description": "GitHub Actions for automated testing",
                "status": StatusEnum.todo,
                "priority": PriorityEnum.medium,
                "position": 1,
                "board_id": db_boards[1].id,
                "assigned_to": db_users[2].id
            }
        ]
        
        for task_data in tasks_data:
            existing_task = db.query(Task).filter(Task.title == task_data["title"]).first()
            if not existing_task:
                db_task = Task(**task_data)
                db.add(db_task)
                db.commit()
                db.refresh(db_task)
                print(f"Created task: {db_task.title}")
            else:
                print(f"Task already exists: {existing_task.title}")
        
        print("Seed data completed successfully!")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()

