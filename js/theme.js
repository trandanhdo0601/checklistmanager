function themeGetData() {
    let data = JSON.parse(localStorage.getItem("study_manager_data"));
    if (!data) {
        data = { users: [] };
        localStorage.setItem("study_manager_data", JSON.stringify(data));
    }
    return data;
}

function themeSaveData(data) {
    localStorage.setItem("study_manager_data", JSON.stringify(data));
}

function getThemeUser() {
    const username = localStorage.getItem("current_user");
    if (!username) return null;
    const data = themeGetData();
    return data.users.find(u => u.username === username) || null;
}

function ensureThemeDefaults(user) {
    if (!user.theme) {
        user.theme = { mode: "light", bgImage: null };
    }
    return user.theme;
}

// Áp dụng theme của tài khoản đang đăng nhập lên trang hiện tại
function applyThemeForCurrentUser() {
    const user = getThemeUser();
    const mode = user && user.theme ? user.theme.mode : "light";
    const bgImage = user && user.theme ? user.theme.bgImage : null;

    document.documentElement.setAttribute("data-theme", mode === "dark" ? "dark" : "light");

    let overlay = document.getElementById("bgOverlay");
    if (bgImage) {
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "bgOverlay";
            document.body.appendChild(overlay);
        }
        const dim = mode === "dark"
            ? "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), "
            : "linear-gradient(rgba(255,255,255,0.45), rgba(255,255,255,0.45)), ";
        overlay.style.backgroundImage = dim + `url("${bgImage}")`;
        overlay.style.display = "block";
    } else if (overlay) {
        overlay.style.display = "none";
    }

    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
        themeBtn.textContent = mode === "dark" ? "☀️ Sáng" : "🌙 Tối";
    }
}

function toggleTheme() {
    const username = localStorage.getItem("current_user");
    if (!username) return;

    const data = themeGetData();
    const user = data.users.find(u => u.username === username);
    if (!user) return;

    const theme = ensureThemeDefaults(user);
    theme.mode = theme.mode === "dark" ? "light" : "dark";

    themeSaveData(data);
    applyThemeForCurrentUser();
}

function handleThemeImageUpload(inputEl) {
    const username = localStorage.getItem("current_user");
    if (!username) return;

    const file = inputEl.files && inputEl.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Vui lòng chọn một tệp hình ảnh!");
        inputEl.value = "";
        return;
    }

    const MAX_SIZE = 1.5 * 1024 * 1024; 
    if (file.size > MAX_SIZE) {
        alert("Ảnh quá lớn! Vui lòng chọn ảnh dưới 1.5MB.");
        inputEl.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = themeGetData();
        const user = data.users.find(u => u.username === username);
        if (!user) return;

        const theme = ensureThemeDefaults(user);
        theme.bgImage = e.target.result;

        themeSaveData(data);
        applyThemeForCurrentUser();
    };
    reader.onerror = function () {
        alert("Không đọc được ảnh, vui lòng thử ảnh khác.");
    };
    reader.readAsDataURL(file);

    inputEl.value = "";
}

function removeThemeImage() {
    const username = localStorage.getItem("current_user");
    if (!username) return;

    const data = themeGetData();
    const user = data.users.find(u => u.username === username);
    if (!user) return;

    const theme = ensureThemeDefaults(user);
    theme.bgImage = null;

    themeSaveData(data);
    applyThemeForCurrentUser();
}

applyThemeForCurrentUser();