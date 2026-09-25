const STORAGE_KEY = "study_manager_data";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 30 * 1000; // 30 giây
 
function getData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { users: [] };
}
 
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
 
// Tạo salt ngẫu nhiên cho mỗi user
function generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}
 
// Băm mật khẩu bằng SHA-256 (Web Crypto API), có trộn salt
async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, "0")).join("");
}
 
function isValidUsername(username) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}
 
function isValidPassword(password) {
    return password.length >= 6;
}
 
function showMessage(text, type) {
    const message = document.getElementById("message");
    message.textContent = text;
    message.className = type === "error" ? "error-msg" : "success-msg";
}
 
async function register() {
    const username = usernameInput();
    const password = passwordInput();
 
    if (!username || !password) {
        showMessage("Nhập đầy đủ thông tin!", "error");
        return;
    }
 
    if (!isValidUsername(username)) {
        showMessage("Username 3-20 ký tự, chỉ gồm chữ/số/gạch dưới!", "error");
        return;
    }
 
    if (!isValidPassword(password)) {
        showMessage("Mật khẩu phải có ít nhất 6 ký tự!", "error");
        return;
    }
 
    let data = getData();
 
    if (data.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        showMessage("Username đã tồn tại!", "error");
        return;
    }
 
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
 
    data.users.push({
        username,
        passwordHash,
        salt,
        failedAttempts: 0,
        lockUntil: 0,
        tasks: {
            study: [],
            work: [],
            daily: []
        }
    });
 
    saveData(data);
    showMessage("Đăng ký thành công!", "success");
    document.getElementById("password").value = "";
}
 
async function login() {
    const username = usernameInput();
    const password = passwordInput();
 
    if (!username || !password) {
        showMessage("Nhập đầy đủ thông tin!", "error");
        return;
    }
 
    let data = getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
 
    if (!user) {
        showMessage("Sai tài khoản hoặc mật khẩu!", "error");
        return;
    }
 
    // Kiểm tra tài khoản có đang bị khóa tạm do đăng nhập sai nhiều lần không
    const now = Date.now();
    if (user.lockUntil && now < user.lockUntil) {
        const secondsLeft = Math.ceil((user.lockUntil - now) / 1000);
        showMessage(`Tài khoản tạm khóa. Thử lại sau ${secondsLeft}s.`, "error");
        return;
    }
 
    // Dữ liệu cũ (trước khi có hash) vẫn còn field "password" dạng thuần
    // -> kiểm tra rồi tự động nâng cấp sang hash, không làm mất tài khoản cũ
    if (!user.passwordHash && user.password) {
        if (user.password !== password) {
            handleFailedLogin(user, data);
            return;
        }
        user.salt = generateSalt();
        user.passwordHash = await hashPassword(password, user.salt);
        delete user.password;
    } else {
        const attemptHash = await hashPassword(password, user.salt);
        if (attemptHash !== user.passwordHash) {
            handleFailedLogin(user, data);
            return;
        }
    }
 
    user.failedAttempts = 0;
    user.lockUntil = 0;
    saveData(data);
 
    localStorage.setItem("current_user", user.username);
    window.location.href = "menu.html";
}
 
function handleFailedLogin(user, data) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
 
    if (user.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCKOUT_TIME_MS;
        user.failedAttempts = 0;
        showMessage(`Sai quá ${MAX_LOGIN_ATTEMPTS} lần. Tài khoản tạm khóa ${LOCKOUT_TIME_MS / 1000}s.`, "error");
    } else {
        showMessage("Sai tài khoản hoặc mật khẩu!", "error");
    }
 
    saveData(data);
    document.getElementById("password").value = "";
}
 
function usernameInput() {
    return document.getElementById("username").value.trim();
}
 
function passwordInput() {
    // Không trim mật khẩu: khoảng trắng có thể là một phần hợp lệ của mật khẩu
    return document.getElementById("password").value;
}