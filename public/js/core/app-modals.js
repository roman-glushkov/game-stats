export class AppModals {
  open(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add("active");
  }

  close(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("active");
  }

  setupClosers() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("active");
        }
      });
    });

    const closeMap = {
      closePlayerModal: "addPlayerModal",
      cancelPlayerModal: "addPlayerModal",
      closeGameModal: "addGameModal",
      cancelGameModal: "addGameModal",
      closeUserModal: "addUserModal",
      cancelUserModal: "addUserModal",
      closeLoginModal: "loginModal",
      cancelLoginModal: "loginModal",
    };

    Object.entries(closeMap).forEach(([btnId, modalId]) => {
      document.getElementById(btnId)?.addEventListener("click", () => {
        this.close(modalId);
      });
    });
  }
}
