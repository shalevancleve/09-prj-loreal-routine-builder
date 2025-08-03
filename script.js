/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const productSearch = document.getElementById("productSearch");

/* Get reference to the Generate Routine button */
const generateRoutineBtn = document.getElementById("generateRoutine");

/* Array to keep track of selected products */
let selectedProducts = [];

/* Store last loaded products for filtering */
let allProducts = [];
let currentCategoryProducts = [];

/* Array to store conversation history */
let chatHistory = [];

/* Load selected products from localStorage if available */
function loadSelectedProducts() {
  const saved = localStorage.getItem("selectedProducts");
  if (saved) {
    try {
      selectedProducts = JSON.parse(saved);
    } catch {
      selectedProducts = [];
    }
  }
}
loadSelectedProducts();

/* Save selected products to localStorage */
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return allProducts;
}

/* Filter products by category and search term */
function filterProducts(category, searchTerm) {
  let filtered = allProducts;
  if (category) {
    filtered = filtered.filter((product) => product.category === category);
  }
  if (searchTerm && searchTerm.trim() !== "") {
    const term = searchTerm.trim().toLowerCase();
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        (product.description &&
          product.description.toLowerCase().includes(term)) ||
        (product.brand && product.brand.toLowerCase().includes(term))
    );
  }
  return filtered;
}

/* Display products based on current filters */
function updateProductDisplay() {
  const selectedCategory = categoryFilter.value;
  const searchTerm = productSearch.value;
  const filteredProducts = filterProducts(selectedCategory, searchTerm);
  currentCategoryProducts = filteredProducts;
  displayProducts(filteredProducts);
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  // Use map to create product cards, add a selected class if chosen
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card${
      selectedProducts.some((p) => p.id === product.id) ? " selected" : ""
    }" 
         data-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="details-btn" data-id="${product.id}">Details</button>
      </div>
    </div>
  `
    )
    .join("");

  // Add click event listeners to each product card for selection
  const cards = productsContainer.querySelectorAll(".product-card");
  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      // Prevent selection if clicking the Details button
      if (event.target.classList.contains("details-btn")) return;
      const productId = card.getAttribute("data-id");
      const product = currentCategoryProducts.find((p) => p.id == productId);
      const index = selectedProducts.findIndex((p) => p.id == productId);
      if (index > -1) {
        selectedProducts.splice(index, 1);
        card.classList.remove("selected");
      } else {
        selectedProducts.push(product);
        card.classList.add("selected");
      }
      saveSelectedProducts();
      updateSelectedProductsList();
    });
  });

  // Add event listeners for Details buttons
  const detailsBtns = productsContainer.querySelectorAll(".details-btn");
  detailsBtns.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent card selection
      const productId = btn.getAttribute("data-id");
      const product = products.find((p) => p.id == productId);
      showProductModal(product);
    });
  });
}

/* Show product description in a modal */
function showProductModal(product) {
  // Create modal HTML
  const modal = document.createElement("div");
  modal.className = "product-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal" tabindex="0" aria-label="Close">&times;</span>
      <h2>${product.name}</h2>
      <p><strong>Brand:</strong> ${product.brand}</p>
      <img src="${product.image}" alt="${
    product.name
  }" style="max-width:120px;display:block;margin:10px auto;">
      <p class="modal-description">${
        product.description || "No description available."
      }</p>
    </div>
  `;
  document.body.appendChild(modal);

  // Focus for accessibility
  modal.querySelector(".close-modal").focus();

  // Close modal on click or keypress
  function closeModal() {
    document.body.removeChild(modal);
  }
  modal.querySelector(".close-modal").addEventListener("click", closeModal);
  modal.querySelector(".close-modal").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") closeModal();
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

/* Update the selected products list above the button */
function updateSelectedProductsList() {
  // Add a "Clear All" button if there are selected products
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<div class="placeholder-message">No products selected</div>`;
    return;
  }
  selectedProductsList.innerHTML =
    selectedProducts
      .map(
        (product, idx) => `
        <div class="product-card small" data-id="${product.id}">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info" style="position: relative; padding-right: 30px;">
            <h3 style="margin-right: 25px; overflow: hidden; text-overflow: ellipsis;">${product.name}</h3>
            <p style="margin-right: 25px; overflow: hidden; text-overflow: ellipsis;">${product.brand}</p>
            <button class="remove-btn" data-index="${idx}" title="Remove" style="position: absolute; top: 50%; right: 5px; transform: translateY(-50%);">&#10005;</button>
          </div>
        </div>
      `
      )
      .join("") +
    `<button id="clearAllBtn" class="generate-btn" style="background:#e74c3c;margin-left:10px;width:auto;padding:8px 16px;font-size:16px;">Clear All</button>`;

  // Add event listeners for remove buttons
  const removeBtns = selectedProductsList.querySelectorAll(".remove-btn");
  removeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(btn.getAttribute("data-index"));
      selectedProducts.splice(idx, 1);
      saveSelectedProducts();
      updateSelectedProductsList();
      // Re-render products to update selection highlight
      // Use updateProductDisplay instead of reloading products
      updateProductDisplay();
    });
  });

  // Add event listener for "Clear All" button
  const clearAllBtn = document.getElementById("clearAllBtn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      selectedProducts = [];
      saveSelectedProducts();
      updateSelectedProductsList();
      // Re-render products to update selection highlight
      // Use updateProductDisplay instead of reloading products
      updateProductDisplay();
    });
  }
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  if (allProducts.length === 0) {
    await loadProducts();
  }
  updateProductDisplay();
});

/* Real-time search: filter products as user types */
productSearch.addEventListener("input", () => {
  updateProductDisplay();
});

/* Chat form submission handler - sends follow-up questions to OpenAI API */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's question from the input field
  const userInput = document.getElementById("userInput").value;

  if (!userInput.trim()) return; // Don't process empty messages

  // Add user message to chat window
  appendMessageToChat("user", userInput);

  // Show loading indicator
  appendMessageToChat("system", "Thinking...", true);

  // If this is the first message after generating a routine,
  // initialize the chat history with system context
  if (chatHistory.length === 0) {
    chatHistory.push({
      role: "system",
      content:
        "You are a helpful beauty routine assistant. Answer questions about products and routines. Use the selected products if relevant.",
    });
  }

  // Add user message to history
  chatHistory.push({
    role: "user",
    content: `${userInput}`,
  });

  try {
    // Send request to Cloudflare Worker with full chat history
    const response = await fetch(
      "https://twilight-cell-bfb8.shalevancleve.workers.dev",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: chatHistory,
        }),
      }
    );

    const data = await response.json();

    // Remove the loading message
    removeLoadingMessage();

    // Check if we got a response from OpenAI
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      const aiResponse = data.choices[0].message.content;
      // Add AI response to chat history
      chatHistory.push({
        role: "assistant",
        content: aiResponse,
      });
      // Display the AI response
      appendMessageToChat("assistant", aiResponse);
    } else {
      appendMessageToChat(
        "system",
        "Sorry, something went wrong. Please try again."
      );
    }
  } catch (error) {
    removeLoadingMessage();
    appendMessageToChat(
      "system",
      "Error connecting to the routine generator. Please try again."
    );
  }

  // Clear the input field after sending
  document.getElementById("userInput").value = "";
});

/* Helper function to append a message to the chat window */
function appendMessageToChat(role, content, isLoading = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${role}`;
  if (isLoading) messageDiv.id = "loading-message";

  // Create a message bubble with appropriate styling based on role
  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "message-bubble";

  // Style the message bubble differently based on the sender
  if (role === "user") {
    bubbleDiv.classList.add("user-bubble");
    bubbleDiv.innerHTML = `<p>${content}</p>`;
    messageDiv.style.textAlign = "right"; // Align user messages to the right
  } else if (role === "assistant") {
    bubbleDiv.classList.add("assistant-bubble");
    bubbleDiv.innerHTML = `<p>${content}</p>`;
    messageDiv.style.textAlign = "left"; // Align AI messages to the left
  } else {
    // System messages (like loading or error messages)
    bubbleDiv.classList.add("system-bubble");
    bubbleDiv.innerHTML = `<p>${content}</p>`;
    messageDiv.style.textAlign = "center"; // Center system messages
  }

  // Add the bubble to the message div
  messageDiv.appendChild(bubbleDiv);

  // Add message to chat window
  chatWindow.appendChild(messageDiv);

  // Scroll to the bottom of the chat window
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Helper function to remove loading message */
function removeLoadingMessage() {
  const loadingMessage = document.getElementById("loading-message");
  if (loadingMessage) {
    chatWindow.removeChild(loadingMessage);
  }
}

/* When the Generate Routine button is clicked, send selected products to OpenAI API */
generateRoutineBtn.addEventListener("click", async () => {
  // If no products are selected, show a message and stop
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML =
      "<div class='chat-message system'><p>Please select at least one product to generate a routine.</p></div>";
    return;
  }

  // Clear chat history and chat window to start a new conversation
  chatHistory = [];
  chatWindow.innerHTML = "";

  // Show loading message
  appendMessageToChat(
    "system",
    "Generating your personalized routine...",
    true
  );

  // Prepare messages for OpenAI API
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful beauty routine assistant. Suggest a routine using the selected products. Be friendly and explain why each product is included.",
    },
    {
      role: "user",
      content: `Here are my selected products:\n${selectedProducts
        .map((p) => `${p.name} (${p.brand})`)
        .join(", ")}`,
    },
  ];

  // Store initial context in chat history
  chatHistory = [...messages];

  try {
    // Send request to Cloudflare Worker
    const response = await fetch(
      "https://twilight-cell-bfb8.shalevancleve.workers.dev",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: messages,
        }),
      }
    );

    const data = await response.json();

    // Remove loading message
    removeLoadingMessage();

    // Check if we got a response from OpenAI
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      const aiResponse = data.choices[0].message.content;
      // Add response to chat history
      chatHistory.push({
        role: "assistant",
        content: aiResponse,
      });
      // Display the response
      appendMessageToChat("assistant", aiResponse);
    } else {
      appendMessageToChat(
        "system",
        "Sorry, something went wrong. Please try again."
      );
    }
  } catch (error) {
    removeLoadingMessage();
    appendMessageToChat(
      "system",
      "Error connecting to the routine generator. Please try again."
    );
  }
});

/* RTL/LTR toggle logic for layout direction */
const rtlToggle = document.getElementById("rtlToggle");
const pageWrapper = document.querySelector(".page-wrapper");

// Function to set direction and update button text
function setDirection(dir) {
  pageWrapper.setAttribute("dir", dir);
  rtlToggle.textContent = dir === "rtl" ? "Switch to LTR" : "Switch to RTL";
  localStorage.setItem("layoutDirection", dir);
}

// Load direction preference on page load
document.addEventListener("DOMContentLoaded", async () => {
  updateSelectedProductsList();
  await loadProducts();
  if (categoryFilter.value) {
    updateProductDisplay();
  }
  const savedDir = localStorage.getItem("layoutDirection");
  setDirection(savedDir === "rtl" ? "rtl" : "ltr");
});

// Toggle direction on button click
rtlToggle.addEventListener("click", () => {
  const currentDir = pageWrapper.getAttribute("dir");
  setDirection(currentDir === "rtl" ? "ltr" : "rtl");
});
