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

// Create User
window.createUser = async () => {
    const u = document.getElementById('newU').value.trim();
    const p = document.getElementById('newP').value.trim();
    const g = document.getElementById('newGrade').value;
    
    if(!u || !p) return alert("❌ Thiếu thông tin!");
    
    const msgEl = document.getElementById('createMsg');
    msgEl.innerText = "⏳ Đang tạo tài khoản...";
    msgEl.style.color = "orange";
    
    let tempApp = null;
    try {
        tempApp = initializeApp(firebaseConfig, "Temp_" + Date.now());
        const tempAuth = getAuth(tempApp);
        
        await createUserWithEmailAndPassword(tempAuth, u + DOMAIN, p);
        await setDoc(doc(db, "users_list", u), { 
            username: u, 
            password: p, 
            grade: g, 
            createdAt: serverTimestamp() 
        });
        
        msgEl.innerText = `✅ Thành công! Đã tạo: ${u} (Khối ${g})`;
        msgEl.style.color = "var(--success)";
        
        document.getElementById('newU').value = "";
        document.getElementById('newP').value = "";
        
        setTimeout(() => loadUsers(), 500);
    } catch(e) { 
        msgEl.innerText = "❌ Lỗi: " + (e.code === 'auth/email-already-in-use' ? 
            'Tài khoản đã tồn tại!' : e.message);
        msgEl.style.color = "var(--danger)";
    } finally {
        if(tempApp) {
            await deleteApp(tempApp);
        }
    }
}

// Import Users from Excel
window.importUsers = async () => {
    const file = document.getElementById('excelUserFile').files[0];
    if(!file) return alert("❌ Chưa chọn file Excel!");
    
    const msgEl = document.getElementById('importMsg');
    const progressBar = document.getElementById('importProgressBar');
    const progressDiv = document.getElementById('importProgress');
    
    progressDiv.classList.remove('hidden');
    msgEl.innerText = "⏳ Đang đọc file...";
    msgEl.style.color = "orange";
    
    try {
        const rows = await readXlsxFile(file);
        const total = rows.length - 1; // Trừ header
        let count = 0;
        let errors = 0;
        
        msgEl.innerText = `Đang xử lý ${total} học sinh... Vui lòng đợi!`;
        
        for(let i = 1; i < rows.length; i++) {
            const name = String(rows[i][0]).trim();
            const pass = String(rows[i][1]).trim();
            const grade = String(rows[i][2]).trim();
            
            if(!name || !pass) {
                errors++;
                continue;
            }
            
            try {
                let tempApp = initializeApp(firebaseConfig, "Import_" + Date.now() + "_" + i);
                const tempAuth = getAuth(tempApp);
                
                await createUserWithEmailAndPassword(tempAuth, name + DOMAIN, pass);
                await setDoc(doc(db, "users_list", name), { 
                    username: name, 
                    password: pass, 
                    grade: grade, 
                    createdAt: serverTimestamp() 
                });
                
                await deleteApp(tempApp);
                count++;
                
                const percent = Math.round((count / total) * 100);
                progressBar.style.width = percent + "%";
                msgEl.innerText = `Đã tạo ${count}/${total} tài khoản...`;
                
            } catch(e) {
                console.error("Lỗi dòng " + i, e);
                errors++;
            }
        }
        
        msgEl.innerText = `🎉 Hoàn tất! Đã thêm ${count} học sinh${errors > 0 ? `, ${errors} lỗi` : ''}.`;
        msgEl.style.color = "var(--success)";
        progressBar.style.width = "100%";
        
        setTimeout(() => {
            loadUsers();
            progressDiv.classList.add('hidden');
        }, 2000);
        
    } catch(e) {
        msgEl.innerText = "❌ Lỗi đọc file: " + e.message;
        msgEl.style.color = "var(--danger)";
        progressDiv.classList.add('hidden');
    }
}

// Load Users
async function loadUsers() {
    const tableDiv = document.getElementById('userTable');
    tableDiv.innerHTML = '<div class="spinner"></div>';
    
    try {
        const snap = await getDocs(query(collection(db, "users_list"), orderBy("createdAt", "desc")));
        
        if(snap.empty) {
            tableDiv.innerHTML = '<p style="text-align:center; color:gray">Chưa có học sinh nào.</p>';
            return;
        }
        
        allUsers = [];
        snap.forEach(d => {
            allUsers.push({ id: d.id, ...d.data() });
        });
        
        renderUsersTable(allUsers);
        
    } catch(e) {
        tableDiv.innerHTML = '<p style="color:red">Lỗi tải danh sách: ' + e.message + '</p>';
    }
}

// Render Users Table
function renderUsersTable(users) {
    const tableDiv = document.getElementById('userTable');
    
    if(users.length === 0) {
        tableDiv.innerHTML = '<p style="text-align:center; color:gray">Không tìm thấy học sinh nào.</p>';
        return;
    }
    
    let html = `<table>
        <tr>
            <th>STT</th>
            <th>Tên Đăng Nhập</th>
            <th>Mật Khẩu</th>
            <th>Khối</th>
            <th>Thao Tác</th>
        </tr>`;
    
    users.forEach((user, index) => {
        html += `<tr class="user-row">
            <td>${index + 1}</td>
            <td>${user.username}</td>
            <td>${user.password}</td>
            <td><span class="badge badge-primary">Khối ${user.grade}</span></td>
            <td>
                <button class="btn-warning btn-small" onclick="openEditModal('${user.username}', '${user.password}', '${user.grade}')">
                    <i class="fas fa-edit"></i> Sửa
                </button>
            </td>
        </tr>`;
    });
    
    tableDiv.innerHTML = html + "</table>";
}

// Filter Users
window.filterUsers = () => {
    const searchText = document.getElementById('searchUser').value.toLowerCase();
    const gradeFilter = document.getElementById('filterUserGrade').value;
    
    let filtered = allUsers.filter(user => {
        const matchName = user.username.toLowerCase().includes(searchText);
        const matchGrade = gradeFilter === 'all' || user.grade == gradeFilter;
        return matchName && matchGrade;
    });
    
    renderUsersTable(filtered);
}

// Open Edit Modal
window.openEditModal = (username, password, grade) => {
    document.getElementById('editUsername').value = username;
    document.getElementById('editPassword').value = password;
    document.getElementById('editGrade').value = grade;
    document.getElementById('editModal').style.display = 'block';
}

// Close Edit Modal
window.closeEditModal = () => {
    document.getElementById('editModal').style.display = 'none';
}

// Save User Edit
window.saveUserEdit = async () => {
    const username = document.getElementById('editUsername').value;
    const newPassword = document.getElementById('editPassword').value.trim();
    const newGrade = document.getElementById('editGrade').value;
    
    if(!newPassword) return alert("❌ Vui lòng nhập mật khẩu!");
    
    try {
        await updateDoc(doc(db, "users_list", username), {
            password: newPassword,
            grade: newGrade
        });
        
        alert("✅ Cập nhật thành công!");
        closeEditModal();
        loadUsers();
    } catch(e) {
        alert("❌ Lỗi: " + e.message);
    }
}

// Delete User
window.deleteUser = async () => {
    const username = document.getElementById('editUsername').value;
    
    if(!confirm(`Bạn có chắc muốn xóa tài khoản "${username}"?`)) return;
    
    try {
        await deleteDoc(doc(db, "users_list", username));
        alert("✅ Đã xóa tài khoản!");
        closeEditModal();
        loadUsers();
    } catch(e) {
        alert("❌ Lỗi: " + e.message);
    }
}

// Export loadUsers to be used by other modules
window.loadUsers = loadUsers;
