const currentUser = localStorage.getItem("current_user");
 
if (!currentUser) {
    window.location.href = "index.html";
}
 
function goTo(type) {
    localStorage.setItem("current_category", type);
    window.location.href = "dashboard.html";
}
 
function goSummary() {
    window.location.href = "summary.html";
}
 
function logout() {
    localStorage.removeItem("current_user");
    window.location.href = "index.html";
}