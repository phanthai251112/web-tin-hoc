// js/users.js

// 1. Import biến chung từ config
import { auth, db, DOMAIN, firebaseConfig } from './firebase-config.js';

// 2. Import App
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// 3. IMPORT QUAN TRỌNG (Đã thêm signInWithEmailAndPassword để sửa lỗi cũ)
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, // <--- Lần trước thiếu cái này nên lỗi
    deleteUser, 
    updatePassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 4. Import Database
import { collection, getDocs, query, orderBy, serverTimestamp, setDoc, doc, deleteDoc, updateDoc } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. TẠO USER (Fix lỗi treo máy) ---
window.createUser = async () => {
    const u = document.getElementById('newU').value.trim();
    const p = document.getElementById('newP').value.trim();
    const g = document.getElementById('newGrade').value;
    
    if(!u || !p) return alert("❌ Thiếu thông tin!");
    
    const msgEl = document.getElementById('createMsg');
    msgEl.innerText = "⏳ Đang xử lý...";
    msgEl.style.color = "blue";
    
    let tempApp = null;
    try {
        // Tạo App phụ để không bị văng Admin ra ngoài
        tempApp = initializeApp(firebaseConfig, "Temp_Create_" + Date.now());
        const tempAuth = getAuth(tempApp);
        
        // Tạo User bên Auth
        await createUserWithEmailAndPassword(tempAuth, u + DOMAIN, p);
        
        // Lưu User bên Database
        await setDoc(doc(db, "users_list", u), { 
            username: u, password: p, grade: g, createdAt: serverTimestamp() 
        });
        
        msgEl.innerText = `✅ Đã tạo: ${u}`;
        msgEl.style.color = "green";
    } catch(e) {
        if(e.code === 'auth/email-already-in-use') {
            // Nếu trùng tên -> Cập nhật lại thông tin trong Database
            try {
                await setDoc(doc(db, "users_list", u), { username: u, password: p, grade: g, createdAt: serverTimestamp() });
                msgEl.innerText = `🔄 Đã cập nhật lại: ${u}`;
                msgEl.style.color = "#d35400";
            } catch(err) { msgEl.innerText = "Lỗi DB: " + err.message; }
        } else {
            msgEl.innerText = "❌ Lỗi: " + e.message;
            msgEl.style.color = "red";
        }
    } finally {
        if(tempApp) await deleteApp(tempApp);
        document.getElementById('newU').value = "";
        setTimeout(() => window.loadUsers(), 500);
    }
}

// --- 2. ĐỔI MẬT KHẨU (Dùng App phụ đăng nhập rồi đổi) ---
window.changeUserPassword = async (username, oldPass) => {
    const newPass = prompt(`Đổi mật khẩu cho "${username}".\nNhập mật khẩu MỚI:`);
    if (!newPass) return;
    if (newPass.length < 6) return alert("❌ Mật khẩu phải từ 6 ký tự trở lên!");

    // Hiệu ứng nút bấm
    const btnId = `btn-pass-${username}`;
    const btn = document.getElementById(btnId);
    if(btn) { btn.innerText = "⏳..."; btn.disabled = true; }

    let tempApp = null;
    try {
        tempApp = initializeApp(firebaseConfig, "Temp_Pass_" + Date.now());
        const tempAuth = getAuth(tempApp);
        
        // Đăng nhập vào nick học sinh (Cần hàm signInWithEmailAndPassword đã import ở trên)
        const userCredential = await signInWithEmailAndPassword(tempAuth, username + DOMAIN, oldPass);
        
        await updatePassword(userCredential.user, newPass);
        await updateDoc(doc(db, "users_list", username), { password: newPass });

        alert(`✅ Đã đổi thành công!\nMật khẩu mới là: ${newPass}`);
        window.loadUsers();
    } catch (e) {
        console.error(e);
        alert("❌ Lỗi: " + e.message + "\n(Có thể mật khẩu cũ lưu trên hệ thống không khớp thực tế)");
    } finally {
        if(tempApp) await deleteApp(tempApp);
        if(btn) { btn.innerHTML = '<i class="fas fa-key"></i> Đổi Pass'; btn.disabled = false; }
    }
}

// --- 3. XÓA USER (Xóa vĩnh viễn cả Auth và DB) ---
window.deleteUser = async (username, password) => {
    if(!confirm(`⚠️ XÓA VĨNH VIỄN tài khoản "${username}"?`)) return;
    
    const btnId = `btn-del-${username}`;
    const btn = document.getElementById(btnId);
    if(btn) { btn.innerText = "⏳..."; btn.disabled = true; }

    let tempApp = null;
    try {
        tempApp = initializeApp(firebaseConfig, "Temp_Delete_" + Date.now());
        const tempAuth = getAuth(tempApp);
        
        // Đăng nhập để lấy quyền xóa
        const userCredential = await signInWithEmailAndPassword(tempAuth, username + DOMAIN, password);
        
        await deleteUser(userCredential.user); // Xóa Auth
        await deleteDoc(doc(db, "users_list", username)); // Xóa DB

        alert(`✅ Đã xóa hoàn toàn: ${username}`);
        window.loadUsers();
    } catch (e) {
        // Nếu không đăng nhập được (sai pass hoặc đã xóa Auth rồi) -> Hỏi xóa DB không
        if(e.code === 'auth/wrong-password' || e.code === 'auth/invalid-login-credentials' || e.code === 'auth/user-not-found') {
            if(confirm(`❌ Không tìm thấy user thực tế (hoặc sai pass). Chỉ xóa khỏi danh sách hiển thị nhé?`)) {
                await deleteDoc(doc(db, "users_list", username));
                window.loadUsers();
            }
        } else {
            alert("❌ Lỗi xóa: " + e.message);
        }
    } finally {
        if(tempApp) await deleteApp(tempApp);
    }
}

// --- 4. TẢI DANH SÁCH ---
window.loadUsers = async () => {
    const tableDiv = document.getElementById('userTable');
    tableDiv.innerHTML = '<div class="spinner">Đang tải...</div>';
    try {
        const snap = await getDocs(query(collection(db, "users_list"), orderBy("createdAt", "desc")));
        if(snap.empty) { tableDiv.innerHTML = '<p style="text-align:center; color:gray">Trống.</p>'; return; }
        
        let html = `<table><tr><th>STT</th><th>Tên ĐN</th><th>Mật Khẩu</th><th>Khối</th><th>Hành Động</th></tr>`;
        let index = 1;
        snap.forEach(d => {
            const u = d.data();
            html += `<tr>
                <td>${index++}</td>
                <td><b>${u.username}</b></td>
                <td>${u.password}</td>
                <td><span class="badge badge-success">K${u.grade}</span></td>
                <td>
                    <button id="btn-pass-${u.username}" class="btn-warning btn-small" 
                        style="background:#f39c12; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-right:5px"
                        onclick="window.changeUserPassword('${u.username}', '${u.password}')">
                        <i class="fas fa-key"></i> Pass
                    </button>
                    <button id="btn-del-${u.username}" class="btn-danger btn-small" 
                        style="background:#c0392b; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer"
                        onclick="window.deleteUser('${u.username}', '${u.password}')">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </td>
            </tr>`;
        });
        tableDiv.innerHTML = html + "</table>";
    } catch(e) { tableDiv.innerHTML = "Lỗi: " + e.message; }
}

// --- 5. IMPORT EXCEL ---
window.importUsers = async () => {
    const file = document.getElementById('excelUserFile').files[0];
    if(!file) return alert("❌ Chưa chọn file Excel!");
    
    const msgEl = document.getElementById('importMsg');
    const progressBar = document.getElementById('importProgressBar');
    document.getElementById('importProgress').classList.remove('hidden');
    
    try {
        const rows = await readXlsxFile(file);
        let count = 0;
        msgEl.innerText = "Đang xử lý...";
        for(let i = 1; i < rows.length; i++) {
            let name = rows[i][0]; let pass = rows[i][1]; let grade = rows[i][2];
            if(!name || name.toString().includes("Tên")) continue;
            name = String(name).trim(); pass = String(pass).trim();
            
            if(progressBar) progressBar.style.width = Math.round((i/rows.length)*100) + "%";
            msgEl.innerText = `Đang chạy dòng ${i}: ${name}`;
            
            try {
                let temp = initializeApp(firebaseConfig, "Imp_"+i);
                await createUserWithEmailAndPassword(getAuth(temp), name + DOMAIN, pass);
                await deleteApp(temp);
            } catch(e) {}
            
            await setDoc(doc(db, "users_list", name), { username: name, password: pass, grade: grade, createdAt: serverTimestamp() });
            count++;
        }
        msgEl.innerText = `✅ Xong! Đã cập nhật ${count} học sinh.`;
        msgEl.style.color = "green";
        window.loadUsers();
    } catch(e) { msgEl.innerText = "❌ Lỗi file: " + e.message; }
}
