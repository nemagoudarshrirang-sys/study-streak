// user.js
// Single responsibility: return a stable user name for the app

export function getUserName() {
  let name = localStorage.getItem("userName");

  if (!name || !name.trim()) {
    name = prompt("Enter your name");
    if (!name || !name.trim()) {
      name = "Anonymous";
    }
    localStorage.setItem("userName", name.trim());
  }

  return name.trim();
}
