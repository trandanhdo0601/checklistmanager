/* ===== Thông báo nhắc deadline (Web Notification API) =====
   Hoạt động trên PC (Chrome/Edge/Firefox) và Android Chrome khi tab/app đang mở.
   Trên iPhone (Safari), chỉ hoạt động nếu người dùng "Thêm vào Màn hình chính"
   (Add to Home Screen) do giới hạn của iOS - đây là hạn chế của hệ điều hành,
   không phải lỗi của trang web.
*/

const NOTIF_CHECK_INTERVAL_MS = 60 * 1000; // kiểm tra mỗi 60 giây
const NOTIF_STORAGE_KEY = "study_manager_data";

function notifGetData() {
    return JSON.parse(localStorage.getItem(NOTIF_STORAGE_KEY)) || { users: [] };
}

function notifSaveData(data) {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(data));
}

function notifCurrentUsername() {
    return localStorage.getItem("current_user");
}

function ensureNotifDefaults(user) {
    if (!user.notifSettings) {
        user.notifSettings = { enabled: false, reminderHours: 24 };
    }
    if (user.notifSettings.reminderHours === undefined) {
        user.notifSettings.reminderHours = 24;
    }
    return user.notifSettings;
}

function ensureTaskId(task) {
    if (!task.id) {
        task.id = (crypto.randomUUID ? crypto.randomUUID() : (Date.now() + "-" + Math.random().toString(36).slice(2)));
    }
    return task.id;
}

function notifSupported() {
    return "Notification" in window;
}

// ---- Bật / tắt thông báo ----

async function enableNotifications() {
    if (!notifSupported()) {
        alert("Trình duyệt này không hỗ trợ thông báo.");
        return false;
    }

    const username = notifCurrentUsername();
    if (!username) return false;

    const permission = await Notification.requestPermission();
    const data = notifGetData();
    const user = data.users.find(u => u.username === username);
    if (!user) return false;

    const settings = ensureNotifDefaults(user);

    if (permission === "granted") {
        settings.enabled = true;
        notifSaveData(data);
        updateNotifUI();
        sendBrowserNotification("Đã bật thông báo ✅", "Bạn sẽ được nhắc khi công việc sắp/đã đến hạn.");
        return true;
    }

    settings.enabled = false;
    notifSaveData(data);
    updateNotifUI();
    alert("Bạn cần cho phép thông báo trong trình duyệt (Cài đặt trang web) để dùng tính năng này.");
    return false;
}

function disableNotifications() {
    const username = notifCurrentUsername();
    if (!username) return;

    const data = notifGetData();
    const user = data.users.find(u => u.username === username);
    if (!user) return;

    const settings = ensureNotifDefaults(user);
    settings.enabled = false;
    notifSaveData(data);
    updateNotifUI();
}

async function toggleNotifications() {
    const username = notifCurrentUsername();
    if (!username) return;

    const data = notifGetData();
    const user = data.users.find(u => u.username === username);
    const settings = user ? ensureNotifDefaults(user) : { enabled: false };

    if (settings.enabled) {
        disableNotifications();
    } else {
        await enableNotifications();
    }
}

function setReminderHours(hours) {
    const username = notifCurrentUsername();
    if (!username) return;

    const data = notifGetData();
    const user = data.users.find(u => u.username === username);
    if (!user) return;

    const settings = ensureNotifDefaults(user);
    settings.reminderHours = Number(hours);
    notifSaveData(data);
}

// ---- Giao diện nút bật/tắt (nếu trang có phần tử tương ứng) ----

function updateNotifUI() {
    const username = notifCurrentUsername();
    const data = notifGetData();
    const user = username ? data.users.find(u => u.username === username) : null;
    const settings = user ? ensureNotifDefaults(user) : { enabled: false, reminderHours: 24 };

    const btn = document.getElementById("notifToggleBtn");
    if (btn) {
        btn.textContent = settings.enabled ? "🔔 Thông báo: Bật" : "🔕 Thông báo: Tắt";
    }

    const select = document.getElementById("notifReminderHours");
    if (select) {
        select.value = String(settings.reminderHours || 24);
    }
}

// ---- Gửi thông báo ----

function sendBrowserNotification(title, body, tag) {
    if (!notifSupported() || Notification.permission !== "granted") return;
    try {
        const n = new Notification(title, { body, tag });
        n.onclick = () => {
            window.focus();
            n.close();
        };
    } catch (e) {
        // Một số trình duyệt mobile (đặc biệt Android) yêu cầu gửi qua Service Worker
        // thay vì gọi trực tiếp `new Notification()`. Bỏ qua an toàn nếu bị chặn.
        console.warn("Không thể gửi thông báo:", e);
    }
}

// ---- Quét công việc và nhắc deadline ----

function checkTasksAndNotify() {
    if (!notifSupported() || Notification.permission !== "granted") return;

    const username = notifCurrentUsername();
    if (!username) return;

    const data = notifGetData();
    const user = data.users.find(u => u.username === username);
    if (!user || !user.tasks) return;

    const settings = ensureNotifDefaults(user);
    if (!settings.enabled) return;

    const reminderMs = (settings.reminderHours || 24) * 60 * 60 * 1000;
    const now = Date.now();
    const todayStr = new Date().toDateString();
    let changed = false;

    ["study", "work", "daily"].forEach(cat => {
        (user.tasks[cat] || []).forEach(task => {
            if (task.status === "Đã xong") return;

            ensureTaskId(task);
            const deadline = new Date(task.deadline).getTime();
            if (isNaN(deadline)) return;

            if (deadline < now) {
                // Quá hạn: nhắc tối đa 1 lần / ngày cho mỗi công việc
                if (task.lastOverdueNotif !== todayStr) {
                    sendBrowserNotification(
                        "⏰ Công việc trễ hạn!",
                        `"${task.title}" đã quá hạn (${task.deadline}).`,
                        "overdue-" + task.id
                    );
                    task.lastOverdueNotif = todayStr;
                    changed = true;
                }
            } else if (deadline - now <= reminderMs && !task.dueSoonNotified) {
                // Sắp đến hạn: nhắc đúng 1 lần
                sendBrowserNotification(
                    "🔔 Sắp đến hạn",
                    `"${task.title}" sẽ đến hạn vào ${task.deadline}.`,
                    "duesoon-" + task.id
                );
                task.dueSoonNotified = true;
                changed = true;
            }
        });
    });

    if (changed) notifSaveData(data);
}

function startNotificationLoop() {
    checkTasksAndNotify();
    setInterval(checkTasksAndNotify, NOTIF_CHECK_INTERVAL_MS);
}

document.addEventListener("DOMContentLoaded", () => {
    updateNotifUI();
    if (notifCurrentUsername()) {
        startNotificationLoop();
    }
});