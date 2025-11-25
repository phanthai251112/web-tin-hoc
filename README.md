# Hệ Thống LMS Tin Học V4

## Cấu trúc thư mục
```
lms-tinhoc/
├── index.html          # Giao diện chính
├── css/
│   └── style.css       # Toàn bộ CSS
├── js/
│   ├── firebase-config.js  # Cấu hình Firebase
│   ├── auth.js            # Xử lý đăng nhập/đăng xuất
│   ├── users.js           # Quản lý học sinh
│   ├── questions.js       # Quản lý câu hỏi/bài tập
│   └── main.js            # Các hàm chung
└── README.md
```

## Hướng dẫn sử dụng

### 1. Đăng nhập
- Tài khoản admin: `phanthai25` / mật khẩu của bạn
- Tài khoản học sinh: username được tạo / mật khẩu

### 2. Quản lý học sinh (Admin)
- **Tạo thủ công**: Nhập từng học sinh
- **Import Excel**: File 3 cột (Tên ĐN | Mật khẩu | Khối)
- **Tìm kiếm & Lọc**: Theo tên hoặc khối
- **Sửa/Xóa**: Click nút "Sửa" trên từng học sinh

### 3. Soạn đề (Admin)
- **Thủ công**: Nhập từng câu hỏi
- **Import Excel**: File 7 cột (Câu hỏi | A | B | C | D | Đáp án | Khối)
- **Import Word**: Format chuẩn với Câu 1, A/B/C/D, Đáp án

### 4. Làm bài (Học sinh)
- Chọn khối để lọc bài tập
- Click đáp án để trả lời
- Xem kết quả ngay lập tức

## Tính năng chính
✅ Đăng nhập Firebase Authentication  
✅ Quản lý học sinh (Thêm/Sửa/Xóa)  
✅ Import hàng loạt từ Excel  
✅ Import câu hỏi từ Word  
✅ Quiz style Quizizz  
✅ Tìm kiếm & lọc theo khối  
✅ Lưu điểm tự động  

## Chú ý
- Đảm bảo có kết nối internet
- File Excel/Word phải đúng format
- Admin mặc định: `phanthai25`
