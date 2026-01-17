const toggleBtn = document.getElementById("toggleControlsBtn");
const mainContent = document.getElementById("mainContent");
const backBtn = document.getElementById("backBtn");

toggleBtn.addEventListener("click", () => {
    mainContent.style.display = "none";
    backBtn.style.display = "block";
    if (typeof flyMode !== "undefined") flyMode.enable();
});
backBtn.addEventListener("click", () => {
    mainContent.style.display = "flex";
    backBtn.style.display = "none";
    if (typeof flyMode !== "undefined") flyMode.disable();
});
