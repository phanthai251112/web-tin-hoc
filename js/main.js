// js/main.js
import { auth, DOMAIN } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- 1. LẮNG NGHE TRẠNG THÁI ĐĂNG NHẬP (QUAN TRỌNG NHẤT) ---
onAuthStateChanged(auth, (user) => {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    const btnLogin = document.querySelector('#loginScreen button');

    if (user) {
        // ==> ĐÃ ĐĂNG NHẬP THÀNH CÔNG
        console.log("Đã vào hệ thống:", user.email);
        
        // 1. Tắt màn hình chờ, Hiện giao diện chính
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');

        // 2. Hiện tên người dùng
        const shortName = user.email.replace(DOMAIN, "");
        if(document.getElementById('uDisplay')) {
            document.getElementById('uDisplay').innerText = shortName;
        }

        // 3. Kiểm tra quyền Admin để hiện Menu
        const adminMenu = document.getElementById('adminMenu');
        if (shortName === "phanthai25" || user.email.includes("admin")) {
            adminMenu.classList.remove('hidden');
            // Tải danh sách học sinh (nếu hàm đã sẵn sàng)
            if(window.loadUsers) window.loadUsers();
        } else {
            adminMenu.classList.add('hidden');
        }

        // 4. Mặc định tải danh sách câu hỏi
        if(window.loadQuestions) window.loadQuestions();

    } else {
        // ==> CHƯA ĐĂNG NHẬP / ĐÃ THOÁT
        console.log("Chưa đăng nhập");
        
        // Hiện lại màn hình đăng nhập
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
        
        // Reset nút đăng nhập
        if(btnLogin) {
            btnLogin.innerHTML = 'Đăng Nhập';
            btnLogin.disabled = false;
        }
    }
});

// --- 2. HÀM CHUYỂN TAB (GIỮ NGUYÊN CỦA BẠN) ---
window.switchTab = (id) => {
    // Ẩn tất cả tab
    ['tab-home', 'tab-users', 'tab-create'].forEach(t => 
        document.getElementById(t).classList.add('hidden'));
    
    // Hiện tab được chọn
    document.getElementById(id).classList.remove('hidden');
    
    // Xử lý active menu (sửa lại chút để không bị lỗi event)
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    
    // Tìm phần tử menu tương ứng để active (dựa vào onclick)
    // Cách đơn giản nhất là dùng event.currentTarget nếu được gọi từ onclick
    if(event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    
    // Load data khi chuyển tab
    if(id === 'tab-home' && window.loadQuestions) window.loadQuestions();
    if(id === 'tab-users' && window.loadUsers) window.loadUsers();
}

// --- 3. HÀM ẨN HIỆN FORM TRẮC NGHIỆM ---
window.toggleType = () => {
    const type = document.getElementById('pType').value;
    const form = document.getElementById('quizForm');
    if(type === 'quiz') form.classList.remove('hidden');
    else form.classList.add('hidden');
}

// --- 4. ĐÓNG MODAL KHI CLICK RA NGOÀI ---
window.onclick = (event) => {
    const modal = document.getElementById('editModal');
    if (modal && event.target == modal) {
        window.closeEditModal();
    }
}
