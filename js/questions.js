import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

// Toggle Quiz Form
window.toggleType = () => {
    const isQuiz = document.getElementById('pType').value === 'quiz';
    document.getElementById('quizForm').classList.toggle('hidden', !isQuiz);
}

// Post Manual Question
window.postManual = async () => {
    const type = document.getElementById('pType').value;
    const grade = document.getElementById('pGrade').value;
    const title = document.getElementById('pTitle').value.trim();
    const content = document.getElementById('pContent').value.trim();
    
    if(grade == 0) return alert("❌ Vui lòng chọn khối!");
    if(!title) return alert("❌ Vui lòng nhập tiêu đề!");
    
    const data = { 
        type, 
        grade, 
        title, 
        content, 
        createdAt: serverTimestamp(), 
        createdBy: auth.currentUser.email 
    };
    
    if(type === 'quiz') {
        const a = document.getElementById('qA').value.trim();
        const b = document.getElementById('qB').value.trim();
        const c = document.getElementById('qC').value.trim();
        const d = document.getElementById('qD').value.trim();
        const correct = document.getElementById('qCorrect').value;
        
        if(!a || !b || !c || !d) return alert("❌ Vui lòng nhập đầy đủ 4 đáp án!");
        
        data.quizData = { A: a, B: b, C: c, D: d, correct: correct };
    }
    
    try {
        await addDoc(collection(db, "questions"), data);
        alert("✅ Đăng bài thành công!");
        
        // Clear form
        document.getElementById('pTitle').value = "";
        document.getElementById('pContent').value = "";
        if(type === 'quiz') {
            document.getElementById('qA').value = "";
            document.getElementById('qB').value = "";
            document.getElementById('qC').value = "";
            document.getElementById('qD').value = "";
        }
        
        loadQuestions();
    } catch(e) {
        alert("❌ Lỗi: " + e.message);
    }
}

// Import Quiz from Excel
window.importQuiz = async () => {
    const file = document.getElementById('excelQuizFile').files[0];
    if(!file) return alert("❌ Chưa chọn file!");
    
    const msgEl = document.getElementById('quizImportMsg');
    const progressBar = document.getElementById('quizProgressBar');
    const progressDiv = document.getElementById('quizImportProgress');
    
    progressDiv.classList.remove('hidden');
    msgEl.innerText = "⏳ Đang đọc file...";
    msgEl.style.color = "orange";
    
    try {
        const rows = await readXlsxFile(file);
        const total = rows.length - 1;
        let count = 0;
        
        msgEl.innerText = `Đang nhập ${total} câu hỏi...`;
        
        for(let i = 1; i < rows.length; i++) {
            const question = String(rows[i][0]).trim();
            const a = String(rows[i][1]).trim();
            const b = String(rows[i][2]).trim();
            const c = String(rows[i][3]).trim();
            const d = String(rows[i][4]).trim();
            const correct = String(rows[i][5]).toUpperCase().trim();
            const grade = String(rows[i][6]).trim();
            
            if(!question || !a) continue;
            
            try {
                await addDoc(collection(db, "questions"), {
                    type: 'quiz',
                    title: question,
                    content: "Câu hỏi trắc nghiệm",
                    grade: grade,
                    quizData: { A: a, B: b, C: c, D: d, correct: correct },
                    createdAt: serverTimestamp(),
                    createdBy: auth.currentUser.email
                });
                count++;
                
                const percent = Math.round((count / total) * 100);
                progressBar.style.width = percent + "%";
                msgEl.innerText = `Đã nhập ${count}/${total} câu...`;
            } catch(e) {
                console.error("Lỗi dòng " + i, e);
            }
        }
        
        msgEl.innerText = `🎉 Hoàn tất! Đã nhập ${count} câu hỏi.`;
        msgEl.style.color = "var(--success)";
        progressBar.style.width = "100%";
        
        setTimeout(() => {
            loadQuestions();
            progressDiv.classList.add('hidden');
        }, 2000);
        
    } catch(e) {
        msgEl.innerText = "❌ Lỗi: " + e.message;
        msgEl.style.color = "var(--danger)";
        progressDiv.classList.add('hidden');
    }
}

// Import Quiz from Word
window.importWord = async () => {
    const file = document.getElementById('wordQuizFile').files[0];
    if(!file) return alert("❌ Chưa chọn file Word!");
    
    const grade = document.getElementById('wordGrade').value;
    const msgEl = document.getElementById('wordImportMsg');
    
    msgEl.innerText = "⏳ Đang đọc file Word...";
    msgEl.style.color = "orange";
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        const text = result.value;
        
        const questions = text.split(/Câu \d+:/i).filter(q => q.trim());
        let count = 0;
        
        msgEl.innerText = `Đang xử lý ${questions.length} câu hỏi...`;
        
        for(let q of questions) {
            const lines = q.split('\n').map(l => l.trim()).filter(l => l);
            if(lines.length < 6) continue;
            
            const questionText = lines[0];
            let a = "", b = "", c = "", d = "", correct = "";
            
            for(let line of lines) {
                if(line.match(/^A[\.\)]/i)) a = line.replace(/^A[\.\)]\s*/i, '');
                else if(line.match(/^B[\.\)]/i)) b = line.replace(/^B[\.\)]\s*/i, '');
                else if(line.match(/^C[\.\)]/i)) c = line.replace(/^C[\.\)]\s*/i, '');
                else if(line.match(/^D[\.\)]/i)) d = line.replace(/^D[\.\)]\s*/i, '');
                else if(line.match(/Đáp án:/i)) {
                    correct = line.replace(/Đáp án:\s*/i, '').toUpperCase().charAt(0);
                }
            }
            
            if(questionText && a && correct) {
                await addDoc(collection(db, "questions"), {
                    type: 'quiz',
                    title: questionText,
                    content: "Câu hỏi từ Word",
                    grade: grade,
                    quizData: { A: a, B: b, C: c, D: d, correct: correct },
                    createdAt: serverTimestamp(),
                    createdBy: auth.currentUser.email
                });
                count++;
                msgEl.innerText = `Đã nhập ${count} câu...`;
            }
        }
        
        msgEl.innerText = `🎉 Hoàn tất! Đã nhập ${count} câu hỏi từ Word.`;
        msgEl.style.color = "var(--success)";
        
        setTimeout(() => loadQuestions(), 1000);
        
    } catch(e) {
        msgEl.innerText = "❌ Lỗi: " + e.message;
        msgEl.style.color = "var(--danger)";
    }
}

// Load Questions
async function loadQuestions() {
    const list = document.getElementById('questionsList');
    const filter = document.getElementById('filterGrade').value;
    
    list.innerHTML = '<div class="spinner"></div>';
    
    try {
        const snap = await getDocs(query(collection(db, "questions"), orderBy("createdAt", "desc")));
        list.innerHTML = "";
        
        if(snap.empty) { 
            list.innerHTML = '<div class="card" style="text-align:center; color:gray"><i class="fas fa-inbox" style="font-size:3em; margin-bottom:10px"></i><p>Chưa có bài tập nào.</p></div>'; 
            return; 
        }

        let questionCount = 0;
        snap.forEach(doc => {
            const d = doc.data();
            if(filter !== 'all' && d.grade != filter) return;
            questionCount++;
            
            const div = document.createElement('div');
            
            if(d.type === 'assignment') {
                div.className = 'card';
                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom:15px">
                        <span class="badge badge-warning">📝 Tự Luận</span>
                        <span class="badge badge-primary">Khối ${d.grade}</span>
                    </div>
                    <h3 style="color:var(--dark); margin-bottom:10px">${d.title}</h3>
                    <p style="color:#666; margin-bottom:15px">${d.content}</p>
                    <textarea id="ans-${doc.id}" rows="4" placeholder="Nhập bài làm của bạn..."></textarea>
                    <button onclick="submitAssignment('${doc.id}')" style="margin-top:10px">
                        <i class="fas fa-paper-plane"></i> Nộp Bài
                    </button>
                `;
            } else {
                div.className = 'quiz-container';
                div.innerHTML = `
                    <div class="quiz-header">
                        <span class="badge badge-primary">Khối ${d.grade}</span>
                        <span class="quiz-score" id="score-${doc.id}">Điểm: 0</span>
                    </div>
                    <div class="question-title">${d.title}</div>
                    <div class="quiz-grid">
                        <div class="quiz-option" onclick="checkAnswer(this,'${doc.id}','A','${d.quizData.correct}')">
                            <strong style="margin-right:10px">A</strong> ${d.quizData.A}
                        </div>
                        <div class="quiz-option" onclick="checkAnswer(this,'${doc.id}','B','${d.quizData.correct}')">
                            <strong style="margin-right:10px">B</strong> ${d.quizData.B}
                        </div>
                        <div class="quiz-option" onclick="checkAnswer(this,'${doc.id}','C','${d.quizData.correct}')">
                            <strong style="margin-right:10px">C</strong> ${d.quizData.C}
                        </div>
                        <div class="quiz-option" onclick="checkAnswer(this,'${doc.id}','D','${d.quizData.correct}')">
                            <strong style="margin-right:10px">D</strong> ${d.quizData.D}
                        </div>
                    </div>
                    <div id="res-${doc.id}" class="result-box"></div>
                `;
            }
            
            list.appendChild(div);
        });
        
        if(questionCount === 0) {
            list.innerHTML = '<div class="card" style="text-align:center; color:gray"><p>Không có bài tập nào cho khối này.</p></div>';
        }
        
    } catch(e) {
        list.innerHTML = '<div class="card" style="color:red">❌ Lỗi tải dữ liệu: ' + e.message + '</div>';
    }
}

// Check Answer
window.checkAnswer = async (el, questionId, choice, correct) => {
    const resBox = document.getElementById(`res-${questionId}`);
    const scoreBox = document.getElementById(`score-${questionId}`);
    const parent = el.parentNode;
    
    parent.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.remove('selected', 'correct', 'wrong');
        opt.style.pointerEvents = 'auto';
    });
    
    el.classList.add('selected');
    resBox.style.display = 'block';
    
    parent.querySelectorAll('.quiz-option').forEach(opt => opt.style.pointerEvents = 'none');
    
    if(choice === correct) {
        el.classList.add('correct');
        resBox.style.background = '#d4edda';
        resBox.style.color = '#155724';
        resBox.innerHTML = '<i class="fas fa-check-circle"></i> CHÍNH XÁC! Tuyệt vời!';
        scoreBox.innerText = 'Điểm: 10';
        scoreBox.style.background = 'var(--success)';
        
        try {
            await addDoc(collection(db, "user_scores"), {
                userId: auth.currentUser.email,
                questionId: questionId,
                score: 10,
                correct: true,
                timestamp: serverTimestamp()
            });
        } catch(e) {
            console.error("Lỗi lưu điểm:", e);
        }
    } else {
        el.classList.add('wrong');
        resBox.style.background = '#f8d7da';
        resBox.style.color = '#721c24';
        resBox.innerHTML = `<i class="fas fa-times-circle"></i> SAI RỒI! Đáp án đúng là <strong>${correct}</strong>`;
        scoreBox.innerText = 'Điểm: 0';
        scoreBox.style.background = 'var(--danger)';
        
        parent.querySelectorAll('.quiz-option').forEach(opt => {
            if(opt.innerText.startsWith(correct)) {
                opt.classList.add('correct');
            }
        });
    }
}

// Submit Assignment
window.submitAssignment = async (questionId) => {
    const answer = document.getElementById(`ans-${questionId}`).value.trim();
    if(!answer) return alert("❌ Vui lòng nhập bài làm!");
    
    try {
        await addDoc(collection(db, "submissions"), { 
            questionId: questionId, 
            studentEmail: auth.currentUser.email, 
            answer: answer, 
            submittedAt: serverTimestamp() 
        });
        
        alert("✅ Nộp bài thành công!");
        document.getElementById(`ans-${questionId}`).value = "";
    } catch(e) {
        alert("❌ Lỗi: " + e.message);
    }
}

window.loadQuestions = loadQuestions;
