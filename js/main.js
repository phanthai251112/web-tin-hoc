// Switch Tab
window.switchTab = (id) => {
    ['tab-home', 'tab-users', 'tab-create'].forEach(t => 
        document.getElementById(t).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    event.target.classList.add('active');
    
    // Load data khi chuyển tab
    if(id === 'tab-home' && window.loadQuestions) window.loadQuestions();
    if(id === 'tab-users' && window.loadUsers) window.loadUsers();
}

// Close modal on outside click
window.onclick = (event) => {
    const modal = document.getElementById('editModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
