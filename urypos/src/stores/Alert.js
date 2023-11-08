import { defineStore } from "pinia";

export const useAlert = defineStore("alert", {
  state: () => ({}),
  actions: {
    createAlert(title, message, buttonText) {
      // Create a backdrop for the modal
      const backdrop = document.createElement("div");
      backdrop.classList.add(
        "fixed",
        "inset-0",
        "z-50",
        "bg-black",
        "opacity-50",
        "backdrop-blur-md"
      );
      document.body.appendChild(backdrop);

      // Create the modal container
      const modal = document.createElement("div");
      modal.classList.add(
        "fixed",
        "top-10",
        "left-1/2",
        "-translate-x-1/2",
        "z-50",
        "transform",
        "bg-white",
        "p-6",
        "rounded-lg",
        "shadow-lg"
      );
      modal.style.maxWidth = "80%"; // Adjust the maximum width as needed
      document.body.appendChild(modal);

      // Create the modal content
      const modalContent = document.createElement("div");
      modalContent.innerHTML = `
        <h2 class="text-base font-semibold mb-4">${title}</h2>
        <hr class="my-6 border-t border-gray-300" />
  
        <p class="mb-4 text-justify text-sm">${message}</p>
        <button class="bg-blue-700 md:ml-96 ml-28  text-white px-4 py-2 rounded-md">${buttonText}</button>
      `;
      modal.appendChild(modalContent);

      // Close the modal and remove the backdrop when the button is clicked
      const closeButton = modalContent.querySelector("button");
      closeButton.addEventListener("click", () => {
        modal.remove();
        backdrop.remove();
      });
    },
  },
});
