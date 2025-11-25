import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, getDocs, query, orderBy, serverTimestamp, setDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db, DOMAIN } from './firebase-config.js';

// Firebase config để tạo temp app
const firebaseConfig = {
    apiKey: "AIzaSyBTNqV64uDH4lCqbgYz3_c7YBwA7LCmTMw",
    authDomain: "tinhoc-1845e.firebaseapp.com",
    projectId: "tinhoc-1845e",
    storageBucket: "tinhoc-1845e.firebasestorage.app",
    messagingSenderId: "1057138431640",
    appId: "1:1057138431640:web:a5f7c257f8b3182e7da2ed",
    measurementId: "G-JKRLEH0B2T"
};

// Global variable to store all users
let allUsers = [];

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
        // 1. Thử tạo tài khoản mới
        tempApp = initializeApp(firebaseConfig, "Temp_" + Date.now());
        const tempAuth = getAuth(tempApp);
        
        await createUserWithEmailAndPassword(tempAuth, u + DOMAIN, p);
        
        // Nếu tạo mới thành công -> Lưu vào Database
        await setDoc(doc(db, "users_list", u), { 
            username: u, password: p, grade: g, createdAt: serverTimestamp() 
        });
        
        msgEl.innerText = `✅ Đã tạo mới: ${u}`;
        msgEl.style.color = "green";

    } catch(e) {
        // 2. NẾU TÀI KHOẢN ĐÃ TỒN TẠI (Lỗi auth/email-already-in-use)
        if(e.code === 'auth/email-already-in-use') {
            console.log("User đã có, đang cập nhật lại...");
            
            // Cứ lưu đè thông tin mới vào Database để hiện lại trong danh sách
            try {
                await setDoc(doc(db, "users_list", u), { 
                    username: u, password: p, grade: g, createdAt: serverTimestamp() 
                });
                
                msgEl.innerText = `🔄 Tài khoản cũ đã được khôi phục vào danh sách: ${u}`;
                msgEl.style.color = "#d35400"; // Màu cam
            } catch(dbErr) {
                msgEl.innerText = "❌ Lỗi DB: " + dbErr.message;
            }
        } else {
            // Lỗi khác
            console.error(e);
            msgEl.innerText = "❌ Lỗi: " + e.message;
            msgEl.style.color = "red";
        }
    } finally {
        // Luôn dọn dẹp app tạm để tránh treo máy
        if(tempApp) await deleteApp(tempApp);
        
        // Reset ô nhập và tải lại bảng
        document.getElementById('newU').value = "";
        setTimeout(() => window.loadUsers(), 500);
    }
}

// --- 2. IMPORT EXCEL (CŨNG THÔNG MINH HƠN) ---
window.importUsers = async () => {
    const file = document.getElementById('excelUserFile').files[0];
    if(!file) return alert("❌ Chưa chọn file Excel!");
    
    const msgEl = document.getElementById('importMsg');
    const progressBar = document.getElementById('importProgressBar');
    document.getElementById('importProgress').classList.remove('hidden');
    
    try {
        const rows = await readXlsxFile(file);
        let count = 0;
        
        // Bắt đầu chạy
        msgEl.innerText = "Đang xử lý...";
        
        for(let i = 1; i < rows.length; i++) {
            let name = rows[i][0]; 
            let pass = rows[i][1]; 
            let grade = rows[i][2];
            
            if(!name || name.toString().includes("Tên")) continue;
            
            name = String(name).trim();
            pass = String(pass).trim();
            
            // Update thanh tiến trình
            if(progressBar) progressBar.style.width = Math.round((i/rows.length)*100) + "%";
            msgEl.innerText = `Đang chạy dòng ${i}: ${name}`;

            // Logic: Cứ thử tạo, lỗi thì thôi, nhưng LUÔN lưu vào Database
            try {
                let temp = initializeApp(firebaseConfig, "Imp_"+i);
                await createUserWithEmailAndPassword(getAuth(temp), name + DOMAIN, pass);
                await deleteApp(temp);
            } catch(e) {
                // Kệ lỗi "đã tồn tại", cứ chạy tiếp
            }

            // Lưu vào Database (Quan trọng nhất)
            await setDoc(doc(db, "users_list", name), { 
                username: name, password: pass, grade: grade, createdAt: serverTimestamp() 
            });
            count++;
        }
        
        msgEl.innerText = `✅ Xong! Đã cập nhật ${count} học sinh.`;
        msgEl.style.color = "green";
        window.loadUsers();

    } catch(e) {
        msgEl.innerText = "❌ Lỗi file: " + e.message;
    }
}

// --- 3. TẢI DANH SÁCH ---
window.loadUsers = async () => {
    const tableDiv = document.getElementById('userTable');
    tableDiv.innerHTML = '<div class="spinner"></div>';
    
    try {
        const snap = await getDocs(query(collection(db, "users_list"), orderBy("createdAt", "desc")));
        
        if(snap.empty) {
            tableDiv.innerHTML = '<p style="text-align:center; color:gray">Chưa có học sinh nào.</p>';
            return;
        }
        
        let html = `<table>
            <tr><th>STT</th><th>Tên ĐN</th><th>Mật Khẩu</th><th>Khối</th><th>Thao Tác</th></tr>`;
        
        let index = 1;
        snap.forEach(d => {
            const u = d.data();
            html += `<tr>
                <td>${index++}</td>
                <td><b>${u.username}</b></td>
                <td>${u.password}</td>
                <td><span class="badge badge-success">K${u.grade}</span></td>
                <td>
                   <button class="btn-danger btn-small" onclick="window.deleteUser('${u.username}')">Xóa List</button>
                </td>
            </tr>`;
        });
        tableDiv.innerHTML = html + "</table>";
    } catch(e) { tableDiv.innerHTML = "Lỗi tải: " + e.message; }
}

// --- 4. XÓA KHỎI DANH SÁCH (CHỈ XÓA LIST) ---
window.deleteUser = async (username) => {
    if(!confirm(`Xóa em "${username}" khỏi danh sách hiển thị?\n(Lưu ý: Tài khoản đăng nhập vẫn tồn tại trên Firebase)`)) return;
    
    try {
        await deleteDoc(doc(db, "users_list", username));
        alert("Đã xóa khỏi danh sách lớp!");
        window.loadUsers();
    } catch(e) { alert("Lỗi: " + e.message); }
}
