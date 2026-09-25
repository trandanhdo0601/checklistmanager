const STORAGE_KEY = "study_manager_data";
const currentUser = localStorage.getItem("current_user");
 
if (!currentUser) {
    window.location.href = "index.html";
}
 
const CATEGORIES = [
    { key: "study", label: "Học tập", icon: "📚" },
    { key: "work", label: "Công việc", icon: "💼" },
    { key: "daily", label: "Hằng ngày", icon: "🏠" }
];
 
function getData() {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!data) {
        data = { users: [] };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    return data;
}
 
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
 
function getUser(data) {
    let user = data.users.find(u => u.username === currentUser);
 
    if (!user.tasks) {
        user.tasks = { study: [], work: [], daily: [] };
        saveData(data);
    }
 
    return user;
}
 
function isLate(task) {
    return task.status !== "Đã xong" && new Date(task.deadline) < new Date();
}
 
function formatCompletedTime(isoString) {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}
 
function renderSummary() {
    const data = getData();
    const user = getUser(data);
 
    document.getElementById("welcome").textContent = currentUser + " - Tổng hợp";
 
    const progressContainer = document.getElementById("progressContainer");
    progressContainer.innerHTML = "";
 
    let allTasks = [];
 
    CATEGORIES.forEach(cat => {
        const tasks = user.tasks[cat.key] || [];
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === "Đã xong").length;
        const late = tasks.filter(isLate).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
 
        tasks.forEach(t => allTasks.push({ ...t, categoryLabel: cat.label }));
 
        const card = document.createElement("div");
        card.className = "progress-card";
        card.innerHTML = `
            <h3>${cat.icon} ${cat.label}</h3>
            <p>${completed}/${total} hoàn thành${late > 0 ? ` • <span class="late">${late} trễ hạn</span>` : ""}</p>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width:${percent}%">${percent}%</div>
            </div>
        `;
        progressContainer.appendChild(card);
    });
 
    // Sắp xếp toàn bộ công việc theo deadline gần nhất
    allTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
 
    const tbody = document.getElementById("summaryTableBody");
    tbody.innerHTML = "";
 
    if (allTasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">Chưa có công việc nào</td></tr>`;
        return;
    }
 
    allTasks.forEach((task, index) => {
        const late = isLate(task);
        const row = document.createElement("tr");
 
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><span class="category-badge">${task.categoryLabel}</span></td>
            <td>${task.title}</td>
            <td class="${late ? "late" : ""}">${task.deadline}${late ? " (Trễ hạn)" : ""}</td>
            <td>${task.status}</td>
            <td>${formatCompletedTime(task.completedAt)}</td>
        `;
 
        tbody.appendChild(row);
    });
}
 
function backMenu() {
    window.location.href = "menu.html";
}
 
function logout() {
    localStorage.removeItem("current_user");
    localStorage.removeItem("current_category");
    window.location.href = "index.html";
}
 
renderSummary();