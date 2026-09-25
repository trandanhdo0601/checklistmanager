/* ===== Xuất / Nhập dữ liệu (chuyển tài khoản giữa các thiết bị) =====
   App này lưu dữ liệu trong localStorage của từng trình duyệt/thiết bị,
   không có server chung, nên tài khoản tạo trên PC sẽ KHÔNG tự xuất hiện
   trên điện thoại. Dùng 2 hàm dưới đây để chuyển dữ liệu thủ công:
   1. Trên thiết bị đã có dữ liệu (vd PC): bấm "Xuất dữ liệu" -> tải về 1 file .json
   2. Trên thiết bị kia (vd điện thoại): chọn file .json đó để "Nhập dữ liệu"
*/

function dtGetData() {
    return JSON.parse(localStorage.getItem("study_manager_data")) || { users: [] };
}

function dtSaveData(data) {
    localStorage.setItem("study_manager_data", JSON.stringify(data));
}

function showTransferMessage(text, type) {
    const el = document.getElementById("transferMessage");
    if (el) {
        el.textContent = text;
        el.className = type === "error" ? "error-msg" : "success-msg";
    } else {
        alert(text);
    }
}

function exportData() {
    const data = dtGetData();

    if (!data.users || data.users.length === 0) {
        showTransferMessage("Chưa có dữ liệu nào trên thiết bị này để xuất.", "error");
        return;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    const filename = `checklist-backup-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showTransferMessage(`Đã xuất ${data.users.length} tài khoản ra tệp "${filename}". Hãy chuyển tệp này sang thiết bị kia (email, USB, Zalo, Drive...) rồi dùng chức năng "Nhập dữ liệu".`, "success");
}

function importData(inputEl) {
    const file = inputEl.files && inputEl.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
        showTransferMessage("Vui lòng chọn một tệp .json hợp lệ!", "error");
        inputEl.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        let incoming;
        try {
            incoming = JSON.parse(e.target.result);
        } catch (err) {
            showTransferMessage("Tệp không đúng định dạng JSON!", "error");
            inputEl.value = "";
            return;
        }

        if (!incoming || !Array.isArray(incoming.users)) {
            showTransferMessage("Tệp không đúng định dạng dữ liệu sao lưu!", "error");
            inputEl.value = "";
            return;
        }

        const localData = dtGetData();
        let added = 0, updated = 0, skipped = 0;

        incoming.users.forEach(incomingUser => {
            if (!incomingUser || !incomingUser.username) return;

            const idx = localData.users.findIndex(
                u => u.username.toLowerCase() === incomingUser.username.toLowerCase()
            );

            if (idx === -1) {
                localData.users.push(incomingUser);
                added++;
            } else {
                const overwrite = confirm(
                    `Tài khoản "${incomingUser.username}" đã có trên thiết bị này.\n` +
                    `Ghi đè bằng dữ liệu trong tệp sao lưu?\n` +
                    `(OK = ghi đè, Hủy = giữ nguyên dữ liệu hiện tại trên máy)`
                );
                if (overwrite) {
                    localData.users[idx] = incomingUser;
                    updated++;
                } else {
                    skipped++;
                }
            }
        });

        dtSaveData(localData);
        inputEl.value = "";

        showTransferMessage(
            `Nhập xong: ${added} tài khoản mới, ${updated} tài khoản đã cập nhật, ${skipped} bỏ qua. Giờ bạn có thể đăng nhập.`,
            "success"
        );
    };

    reader.onerror = function () {
        showTransferMessage("Không đọc được tệp, vui lòng thử lại.", "error");
        inputEl.value = "";
    };

    reader.readAsText(file);
}