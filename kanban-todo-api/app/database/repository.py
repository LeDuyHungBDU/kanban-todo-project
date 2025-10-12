from sqlalchemy.orm import Session
from typing import List, Optional, Generic, TypeVar, Type
from .models import User, Board, Task, StatusEnum, PriorityEnum

# Generic types
ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")

class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model
    
    def get(self, db: Session, id: int) -> Optional[ModelType]:
        return db.query(self.model).filter(self.model.id == id).first()
    
    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[ModelType]:
        return db.query(self.model).offset(skip).limit(limit).all()
    
    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        obj_data = obj_in.dict() if hasattr(obj_in, 'dict') else obj_in
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(self, db: Session, *, db_obj: ModelType, obj_in: UpdateSchemaType) -> ModelType:
        obj_data = obj_in.dict(exclude_unset=True) if hasattr(obj_in, 'dict') else obj_in
        for field, value in obj_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, *, id: int) -> ModelType:
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj

# Tạo User repository
class UserRepository(BaseRepository[User, dict, dict]):
    def __init__(self):
        super().__init__(User)
    
    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()
    
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()
    
    def create_user(self, db: Session, user_data: dict) -> User:
        # Trong thực tế sẽ hash password ở đây
        db_user = User(**user_data)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
        
# Tạo Board repository
class BoardRepository(BaseRepository[Board, dict, dict]):
    def __init__(self):
        super().__init__(Board)
    
    def get_by_owner(self, db: Session, owner_id: int) -> List[Board]:
        return db.query(Board).filter(Board.owner_id == owner_id).all()
    
    def get_public_boards(self, db: Session) -> List[Board]:
        return db.query(Board).filter(Board.is_public == True).all()

# Tạo Task repository
class TaskRepository(BaseRepository[Task, dict, dict]):
    def __init__(self):
        super().__init__(Task)
    
    def get_by_board(self, db: Session, board_id: int) -> List[Task]:
        return db.query(Task).filter(Task.board_id == board_id).order_by(Task.position).all()
    
    def get_by_status(self, db: Session, board_id: int, status: StatusEnum) -> List[Task]:
        return db.query(Task).filter(
            Task.board_id == board_id,
            Task.status == status
        ).order_by(Task.position).all()
    
    def get_by_assigned_user(self, db: Session, user_id: int) -> List[Task]:
        return db.query(Task).filter(Task.assigned_to == user_id).all()
    
    def search_tasks(self, db: Session, query: str, board_id: Optional[int] = None) -> List[Task]:
        search_query = db.query(Task).filter(
            Task.title.contains(query) | Task.description.contains(query)
        )
        
        if board_id:
            search_query = search_query.filter(Task.board_id == board_id)
        
        return search_query.all()
    
    def move_task(self, db: Session, task_id: int, new_status: StatusEnum, new_position: Optional[int] = None) -> Optional[Task]:
        task = self.get(db, task_id)
        if not task:
            return None
        
        old_status = task.status
        task.status = new_status
        
# Tính position mới nếu không được specify
        if new_status != old_status and new_position is None:
            tasks_in_new_status = self.get_by_status(db, task.board_id, new_status)
            new_position = len(tasks_in_new_status)
        
        if new_position is not None:
            task.position = new_position
        
        db.commit()
        db.refresh(task)
        return task

# Global instances
user_repository = UserRepository()
board_repository = BoardRepository()
task_repository = TaskRepository()
