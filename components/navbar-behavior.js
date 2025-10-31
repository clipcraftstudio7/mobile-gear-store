// Navbar dropdown and user menu behavior
function initNavbarBehavior() {
  // Categories Dropdown
  const catBtn = document.getElementById("categories-dropdown-btn");
  const catContent = document.getElementById("categories-dropdown-content");
  const catArrow = document.getElementById("categories-arrow");
  if (catBtn && catContent && catArrow) {
    catBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      const open = catContent.style.display === "block";
      catContent.style.display = open ? "none" : "block";
      catArrow.style.transform = open ? "rotate(0deg)" : "rotate(180deg)";
    };
    document.addEventListener("click", function (e) {
      if (!catContent.contains(e.target) && e.target !== catBtn) {
        catContent.style.display = "none";
        catArrow.style.transform = "rotate(0deg)";
      }
    });
    Array.from(catContent.querySelectorAll("a")).forEach((a) => {
      a.onclick = function () {
        catContent.style.display = "none";
        catArrow.style.transform = "rotate(0deg)";
      };
    });
  }
  // User Dropdown
  const userBtn = document.getElementById("user-email-btn");
  const userDropdown = document.getElementById("user-dropdown");
  if (userBtn && userDropdown) {
    userBtn.onclick = function (e) {
      e.stopPropagation();
      userDropdown.style.display =
        userDropdown.style.display === "block" ? "none" : "block";
    };
    document.addEventListener("click", function (e) {
      if (!userDropdown.contains(e.target) && e.target !== userBtn) {
        userDropdown.style.display = "none";
      }
    });
  }
}
window.initNavbarBehavior = initNavbarBehavior;
