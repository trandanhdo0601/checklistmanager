const STORAGE_KEY = "study_manager_data";
const currentUser = localStorage.getItem("current_user");
const currentCategory = localStorage.getItem("current_category");
 
if (!currentUser || !currentCategory) {
    window.location.href = "index.html";
}
 
document.getElementById("welcome").textContent =
    currentUser + " - " + categoryName();
 
function categoryName() {
    if (currentCategory === "study") return "Học tập";
    if (currentCategory === "work") return "Công việc";
    return "Hằng ngày";
}
 
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
 
    // Nếu user không có cấu trúc tasks thì tạo lại
    if (!user.tasks) {
        user.tasks = {
            study: [],
            work: [],
            daily: []
        };
        saveData(data);
    }
 
    return user;
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
 
function renderTasks() {
    const data = getData();
    const user = getUser(data);
 
    // Nếu category chưa tồn tại thì tạo
    if (!user.tasks[currentCategory]) {
        user.tasks[currentCategory] = [];
        saveData(data);
    }
 
    const tasks = user.tasks[currentCategory];
    const tbody = document.getElementById("taskTableBody");
    tbody.innerHTML = "";
 
    tasks.forEach((task, index) => {
        const today = new Date();
        const deadline = new Date(task.deadline);
 
        let lateText = "";
        let lateClass = "";
 
        if (task.status !== "Đã xong" && deadline < today) {
            lateText = " (Trễ hạn)";
            lateClass = "late";
        }
 
        const row = document.createElement("tr");
 
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${task.title}</td>
            <td>${task.deadline}</td>
            <td class="${lateClass}">
                <select onchange="changeStatus(${index}, this.value)">
                    <option value="Chưa xong" ${task.status === "Chưa xong" ? "selected" : ""}>Chưa xong</option>
                    <option value="Đã xong" ${task.status === "Đã xong" ? "selected" : ""}>Đã xong</option>
                </select>
                ${lateText}
            </td>
            <td>${formatCompletedTime(task.completedAt)}</td>
            <td><button onclick="deleteTask(${index})">X</button></td>
        `;
 
        tbody.appendChild(row);
    });
}
 
function addTask() {
    const title = document.getElementById("taskTitle").value.trim();
    const deadline = document.getElementById("taskDeadline").value;
 
    if (!title || !deadline) {
        alert("Nhập đầy đủ thông tin!");
        return;
    }
 
    const data = getData();
    const user = getUser(data);
 
    if (!user.tasks[currentCategory]) {
        user.tasks[currentCategory] = [];
    }
 
    user.tasks[currentCategory].push({
        id: (crypto.randomUUID ? crypto.randomUUID() : (Date.now() + "-" + Math.random().toString(36).slice(2))),
        title,
        deadline,
        status: "Chưa xong",
        completedAt: null
    });
 
    saveData(data);
 
    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDeadline").value = "";
 
    renderTasks();
}
 
function changeStatus(index, value) {
    const data = getData();
    const user = getUser(data);
    const task = user.tasks[currentCategory][index];
 
    task.status = value;
 
    // Ghi lại thời điểm hoàn thành, hoặc xóa đi nếu chuyển về "Chưa xong"
    if (value === "Đã xong") {
        task.completedAt = new Date().toISOString();
    } else {
        task.completedAt = null;
    }
 
    saveData(data);
    renderTasks();
}
 
function deleteTask(index) {
    const data = getData();
    const user = getUser(data);
 
    user.tasks[currentCategory].splice(index, 1);
 
    saveData(data);
    renderTasks();
}
 
function backMenu() {
    window.location.href = "menu.html";
}
 
function logout() {
    localStorage.removeItem("current_user");
    localStorage.removeItem("current_category");
    window.location.href = "index.html";
}
 
renderTasks();