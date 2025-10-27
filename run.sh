#!/bin/bash

# Script để khởi động cả API và Frontend

echo "Khởi động Kanban TODO Project..."

# Kiểm tra xem venv có tồn tại không
if [ ! -d "kanban-todo-api/.venv" ]; then
    echo "Lỗi: Không tìm thấy môi trường ảo .venv trong kanban-todo-api/"
    echo "Vui lòng tạo venv trước: cd kanban-todo-api && python -m venv .venv"
    exit 1
fi

# Kích hoạt venv và cài đặt dependencies cho API
echo "Khởi động API server..."
cd kanban-todo-api
source .venv/bin/activate
pip install --break-system-packages --upgrade -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
API_PID=$!

# Quay lại thư mục gốc và chạy Frontend
cd ..
echo "Khởi động Frontend server..."
cd kanban-frontend

# Kill any existing process on port 3000
pkill -f "python3 -m http.server 3000" || true
sleep 1

python3 -m http.server 3000 --bind 0.0.0.0 &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "Kanban TODO Project đã khởi động thành công!"
echo "=========================================="
echo "API server: http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
echo "Frontend: http://localhost:3000"
echo ""
echo "Nhấn Ctrl+C để dừng tất cả services"

# Hàm cleanup khi script bị dừng
cleanup() {
    echo ""
    echo "Dừng services..."
    kill $API_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Đã dừng tất cả services."
    exit 0
}

# Bắt tín hiệu Ctrl+C
trap cleanup SIGINT

# Giữ script chạy
wait