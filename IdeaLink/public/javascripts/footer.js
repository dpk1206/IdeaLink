const modal = document.getElementById("modal-container");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");

const openModal = (htmlContent) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const bodyContent = doc.body.innerHTML;

  modalBody.innerHTML = bodyContent;
  modal.style.display = "flex";

  const scrollBarWidth =
    window.innerWidth - document.documentElement.clientWidth;
  document.body.style.paddingRight = `${scrollBarWidth}px`;
  document.body.classList.add("modal-open");
};

const closeModal = () => {
  modal.style.display = "none";
  document.body.classList.remove("modal-open");
  document.body.style.paddingRight = ""; // 초기화
};

document.getElementById("open-terms-modal")?.addEventListener("click", (e) => {
  e.preventDefault();
  fetch("/terms") // 서버 라우터로 요청
    .then((res) => res.text())
    .then(openModal);
});
document.getElementById("open-privacy-modal")?.addEventListener("click", (e) => {
  e.preventDefault();
  fetch("/privacy") // 서버 라우터로 요청
    .then((res) => res.text())
    .then(openModal);
});

modalClose?.addEventListener("click", closeModal);

window.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
