const API = "/api";

const $ = selector => document.querySelector(selector);

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function showStatus(element, message, error = false) {
  if (!element) return;
  element.textContent = message;
  element.className = error ? "status error" : "status";
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Request failed.");
  }

  return result;
}

// Mobile navigation
const menuButton = $("#menuButton");
const navigation = $("#navigation");

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    navigation.classList.toggle("open");
  });

  navigation.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
    });
  });
}

// Startup directory
async function loadStartups() {
  const grid = $("#startupList");
  if (!grid) return;

  grid.innerHTML = "<p>Loading startups...</p>";

  try {
    const search = $("#searchInput")?.value.trim() || "";
    const data = await request(
      API + "/startups?search=" + encodeURIComponent(search)
    );

    if (data.length === 0) {
      grid.innerHTML = "<p>No startups found. Try another search.</p>";
      return;
    }

    grid.innerHTML = data.map(s => `
      <article class="card">
        <div class="card-icon">🌱</div>
        <h3>${safe(s.name)}</h3>
        <p><strong>Owner:</strong> ${safe(s.owner)}</p>
        <p><strong>Category:</strong> ${safe(s.category)}</p>
        <p><strong>Location:</strong> ${safe(s.village)}</p>
        <p>${safe(s.description)}</p>
        <p><strong>Contact:</strong> ${safe(s.contact)}</p>
      </article>
    `).join("");
  } catch (error) {
    grid.textContent = error.message + " Start the Node.js server first.";
  }
}

if ($("#startupList")) {
  loadStartups();
  $("#searchInput")?.addEventListener("input", loadStartups);
}

// Register startup form
const startupForm = $("#startupForm");

if (startupForm) {
  startupForm.addEventListener("submit", async event => {
    event.preventDefault();

    const status = $("#startupStatus");
    const button = startupForm.querySelector("button[type=submit]");
    button.disabled = true;
    showStatus(status, "Saving startup...");

    const formData = Object.fromEntries(
      new FormData(startupForm).entries()
    );

    try {
      const result = await request(API + "/startups", {
        method: "POST",
        body: JSON.stringify(formData)
      });

      startupForm.reset();
      showStatus(status, result.message);
    } catch (error) {
      showStatus(status, error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}

// Contact Us form
const contactForm = $("#contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", async event => {
    event.preventDefault();

    const status = $("#contactStatus");
    const button = contactForm.querySelector("button[type=submit]");
    button.disabled = true;
    showStatus(status, "Sending enquiry...");

    const formData = Object.fromEntries(
      new FormData(contactForm).entries()
    );

    try {
      const result = await request(API + "/messages", {
        method: "POST",
        body: JSON.stringify(formData)
      });

      contactForm.reset();
      showStatus(status, result.message);
    } catch (error) {
      showStatus(status, error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}
// Learning Hub
async function loadResources() {
  const grid = $("#resourceList");
  if (!grid) return;

  try {
    const resources = await request(API + "/resources");

    grid.innerHTML = resources.map(r => `
      <article class="card">
        <div class="card-icon">📘</div>
        <h3>${safe(r.title)}</h3>
        <p>${safe(r.description)}</p>
        <small>${safe(r.category)}</small>
      </article>
    `).join("");
  } catch (error) {
    grid.textContent = error.message;
  }
}

loadResources();

// Admin: show saved contact enquiries
async function loadMessages() {
  const list = $("#messageList");
  if (!list) return;

  try {
    const messages = await request(API + "/messages");

    if (messages.length === 0) {
      list.innerHTML = "<p>No enquiries have been received yet.</p>";
      return;
    }

    list.innerHTML = messages.map(m => `
      <article class="card">
        <h3>${safe(m.name)}</h3>
        <p><strong>Email:</strong> ${safe(m.email)}</p>
        <p><strong>Topic:</strong> ${safe(m.topic)}</p>
        <p>${safe(m.message)}</p>
        <small>${safe(m.date || "")}</small>
      </article>
    `).join("");
  } catch (error) {
    list.textContent = error.message;
  }
}

loadMessages();