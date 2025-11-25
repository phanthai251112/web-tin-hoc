// js/auth.js
import { auth, DOMAIN } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// HÀM ĐĂNG NHẬP
window.login = async () => {
    let u = document.getElementById('loginUser').value.trim();
    let p = document.getElementById('loginPass').value.trim();
    const msg = document.getElementById('loginMsg');
    
    if(!u || !p) {
        msg.innerText = "Vui lòng nhập đầy đủ thông tin!";
        return;
    }

    // Tự động thêm đuôi @tinoc.com nếu thiếu
    if(!u.includes("@")) u += DOMAIN;

    // Đổi nút bấm thành đang xử lý
    const btn = document.querySelector('#loginScreen button');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang vào...';
    btn.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, u, p);
        // Đăng nhập thành công -> main.js sẽ tự bắt sự kiện onAuthStateChanged để chuyển màn hình
    } catch(e) {
        console.error(e);
        msg.innerText = "❌ Sai tên đăng nhập hoặc mật khẩu!";
        // Trả lại nút bấm
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}

// HÀM ĐĂNG XUẤT
window.logout = async () => {
    if(confirm("Bạn muốn đăng xuất?")) {
        try {
            await signOut(auth);
            // Reload để xóa sạch các biến tạm trong bộ nhớ
            window.location.reload();
        } catch(e) {
            alert("Lỗi đăng xuất: " + e.message);
        }
    }
}
