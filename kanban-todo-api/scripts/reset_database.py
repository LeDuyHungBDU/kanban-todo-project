import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, SessionLocal

def reset_database():
    """Reset database - drop all tables and recreate them"""
    print("Resetting database...")

    try:
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        print("Dropped all tables")

        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("Created all tables")

        print("Database reset successfully!")

    except Exception as e:
        print(f"Error resetting database: {e}")
        raise

if __name__ == "__main__":
    reset_database()
