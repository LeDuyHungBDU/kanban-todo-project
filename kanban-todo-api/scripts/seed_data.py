import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, User, Board, Task, StatusEnum, PriorityEnum
from app.core.security import get_password_hash
from datetime import datetime, timedelta

def seed_data():
    """Tạo dữ liệu mẫu với users có password hash và roles"""
    db = SessionLocal()
    
    try:
        # Tạo admin user
        admin_data = {
            "username": "admin",
            "email": "admin@kanban.com",
            "password_hash": get_password_hash("admin123"),  # Hash password
            "full_name": "System Administrator",
            "role": "admin",
            "is_active": True
        }
        
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if not existing_admin:
            admin_user = User(**admin_data)
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("✅ Created admin user (admin/admin123)")
        else:
            admin_user = existing_admin
            print("ℹ️  Admin user already exists")
        
        # Tạo regular users
        users_data = [
            {
                "username": "johndoe",
                "email": "john@example.com",
                "password_hash": get_password_hash("password123"),
                "full_name": "John Doe",
                "role": "user",
                "is_active": True
            },
            {
                "username": "janesmith",
                "email": "jane@example.com", 
                "password_hash": get_password_hash("password123"),
                "full_name": "Jane Smith",
                "role": "user",
                "is_active": True
            }
        ]
        
        db_users = [admin_user]
        for user_data in users_data:
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            if not existing_user:
                db_user = User(**user_data)
                db.add(db_user)
                db.commit()
                db.refresh(db_user)
                db_users.append(db_user)
                print(f"✅ Created user: {db_user.username}")
            else:
                db_users.append(existing_user)
                print(f"ℹ️  User already exists: {existing_user.username}")
        
        # Tạo sample boards
        boards_data = [
            {
                "name": "Project Alpha",
                "description": "Main project for Q4 2025",
                "is_public": True,
                "owner_id": admin_user.id
            },
            {
                "name": "Personal Tasks",
                "description": "Personal todo list",
                "is_public": False,
                "owner_id": db_users[1].id  # johndoe
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
                print(f"✅ Created board: {db_board.name}")
            else:
                db_boards.append(existing_board)
                print(f"ℹ️  Board already exists: {existing_board.name}")

        # Tạo sample tasks
        if db_boards:
            tasks_data = [
                {
                    "title": "Setup development environment",
                    "description": "Install all necessary tools and dependencies",
                    "status": StatusEnum.done,
                    "priority": PriorityEnum.high,
                    "board_id": db_boards[0].id,
                    "assigned_to": admin_user.id
                },
                {
                    "title": "Design database schema",
                    "description": "Create ER diagram and define all tables",
                    "status": StatusEnum.done,
                    "priority": PriorityEnum.high,
                    "board_id": db_boards[0].id,
                    "assigned_to": admin_user.id
                },
                {
                    "title": "Implement authentication",
                    "description": "JWT-based authentication system",
                    "status": StatusEnum.done,
                    "priority": PriorityEnum.medium,
                    "board_id": db_boards[0].id,
                    "assigned_to": db_users[1].id
                },
                {
                    "title": "Create API endpoints",
                    "description": "RESTful API for boards and tasks",
                    "status": StatusEnum.in_progress,
                    "priority": PriorityEnum.high,
                    "board_id": db_boards[0].id,
                    "assigned_to": db_users[2].id
                },
                {
                    "title": "Write documentation",
                    "description": "API documentation and user guides",
                    "status": StatusEnum.todo,
                    "priority": PriorityEnum.medium,
                    "board_id": db_boards[0].id,
                    "assigned_to": db_users[1].id
                },
                {
                    "title": "Buy groceries",
                    "description": "Milk, bread, eggs, fruits",
                    "status": StatusEnum.todo,
                    "priority": PriorityEnum.low,
                    "board_id": db_boards[1].id,
                    "assigned_to": db_users[1].id
                }
            ]

            for task_data in tasks_data:
                existing_task = db.query(Task).filter(
                    Task.title == task_data["title"],
                    Task.board_id == task_data["board_id"]
                ).first()
                if not existing_task:
                    db_task = Task(**task_data)
                    db.add(db_task)
                    db.commit()
                    db.refresh(db_task)
                    print(f"✅ Created task: {db_task.title}")
                else:
                    print(f"ℹ️  Task already exists: {existing_task.title}")
        
        print("\n🎉 Seed data completed successfully!")
        print("\n👤 Login credentials:")
        print("   Admin: admin / admin123")
        print("   User:  johndoe / password123")
        print("   User:  janesmith / password123")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
