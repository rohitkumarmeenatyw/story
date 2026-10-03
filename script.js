
// =========================
// STORYNEST - MAIN SCRIPT
// =========================

// DOM Elements
const searchInput = document.getElementById("book-search");
const searchBtn = document.getElementById("search-btn");
const bookResults = document.getElementById("book-results");
const searchStatus = document.getElementById("search-status");
const filterButtons = document.querySelectorAll(".filter-btn");

const diaryTitle = document.getElementById("diary-title");
const diaryContent = document.getElementById("diary-content");
const saveEntryBtn = document.getElementById("save-entry");
const cancelEditBtn = document.getElementById("cancel-edit");
const diaryEntries = document.getElementById("diary-entries");
const entryCount = document.getElementById("entry-count");
const diaryDate = document.getElementById("diary-date");

// State
let currentFilter = "all";
let editingId = null;
let books = [];

// =========================
// BOOK SEARCH
// =========================

async function searchBooks() {
    const query = searchInput.value.trim();

    if (!query) {
        searchStatus.textContent = "Enter a book title or author.";
        return;
    }

    searchStatus.textContent = "Searching books...";
    bookResults.innerHTML = "";

    const searchType = {
        all: "",
        title: "title",
        author: "author",
        subject: "subject"
    };

    const field = searchType[currentFilter];
    const url = `https://openlibrary.org/search.json?${
        field ? field + "=" : "q="
    }${encodeURIComponent(query)}&limit=20`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to fetch books.");
        }

        const data = await response.json();
        books = data.docs || [];

        if (books.length === 0) {
            searchStatus.textContent = "No books found.";
            showEmptyBooks();
            return;
        }

        searchStatus.textContent =
            `${books.length} results found`;

        displayBooks(books);

    } catch (error) {
        console.error(error);
        searchStatus.textContent =
            "Something went wrong. Try again.";
        showEmptyBooks();
    }
}

// =========================
// DISPLAY BOOKS
// =========================

function displayBooks(bookList) {
    bookResults.innerHTML = "";

    bookList.forEach(book => {
        const card = document.createElement("article");
        card.className = "book-card";

        const cover = document.createElement("img");
        cover.className = "book-cover";
        cover.alt = `Cover of ${book.title || "Untitled"}`;
        cover.loading = "lazy";

        if (book.cover_i) {
            cover.src =
                `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
        } else {
            cover.src =
                "https://placehold.co/300x450/29261f/e8dfcd?text=No+Cover";
        }

        const title = document.createElement("h3");
        title.textContent = book.title || "Untitled";

        const author = document.createElement("p");
        author.textContent =
            book.author_name?.slice(0, 2).join(", ") ||
            "Unknown author";

        const year = document.createElement("p");
        year.textContent = book.first_publish_year
            ? `First published: ${book.first_publish_year}`
            : "Publication year unavailable";

        const readBtn = document.createElement("button");
        readBtn.type = "button";
        readBtn.textContent = "View Book";

        readBtn.addEventListener("click", () => {
            const key = book.key;

            if (key) {
                window.open(
                    `https://openlibrary.org${key}`,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
        });

        card.append(cover, title, author, year, readBtn);
        bookResults.appendChild(card);
    });
}

function showEmptyBooks() {
    bookResults.innerHTML = `
        <div class="empty-message">
            <h3>No books to display.</h3>
            <p>Try another search.</p>
        </div>
    `;
}

// Search button
searchBtn.addEventListener("click", searchBooks);

// Search on Enter
searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        searchBooks();
    }
});

// =========================
// SEARCH FILTERS
// =========================

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");
        currentFilter = button.dataset.filter;

        if (searchInput.value.trim()) {
            searchBooks();
        }
    });
});

// =========================
// DIARY STORAGE
// =========================

function getEntries() {
    try {
        return JSON.parse(
            localStorage.getItem("storynest_entries")
        ) || [];
    } catch (error) {
        console.error("Could not load diary entries:", error);
        return [];
    }
}

function saveEntries(entries) {
    try {
        localStorage.setItem(
            "storynest_entries",
            JSON.stringify(entries)
        );
        return true;
    } catch (error) {
        console.error("Could not save diary entries:", error);
        alert("Unable to save. Browser storage may be full.");
        return false;
    }
}

// =========================
// SAVE DIARY ENTRY
// =========================

function saveDiaryEntry() {
    const title = diaryTitle.value.trim();
    const content = diaryContent.value.trim();

    if (!title || !content) {
        alert("Please enter both a title and your thoughts.");
        return;
    }

    const entries = getEntries();

    if (editingId !== null) {
        const index = entries.findIndex(
            entry => entry.id === editingId
        );

        if (index !== -1) {
            entries[index].title = title;
            entries[index].content = content;
            entries[index].updatedAt = new Date().toISOString();
        }
    } else {
        entries.unshift({
            id: Date.now().toString(),
            title,
            content,
            createdAt: new Date().toISOString()
        });
    }

    if (!saveEntries(entries)) return;

    resetEditor();
    renderEntries();
}

saveEntryBtn.addEventListener("click", saveDiaryEntry);

// =========================
// DISPLAY DIARY ENTRIES
// =========================

function renderEntries() {
    const entries = getEntries();

    diaryEntries.innerHTML = "";
    entryCount.textContent =
        `${entries.length} ${
            entries.length === 1 ? "entry" : "entries"
        }`;

    if (entries.length === 0) {
        diaryEntries.innerHTML = `
            <div class="empty-message">
                <h3>Your pages are waiting to be filled.</h3>
                <p>Write your first diary entry above.</p>
            </div>
        `;
        return;
    }

    entries.forEach(entry => {
        const card = document.createElement("article");
        card.className = "diary-entry";

        const title = document.createElement("h3");
        title.textContent = entry.title;

        const date = document.createElement("span");
        date.className = "entry-date";

        const dateValue = entry.updatedAt || entry.createdAt;
        date.textContent = dateValue
            ? new Date(dateValue).toLocaleString()
            : "";

        const content = document.createElement("p");
        content.textContent = entry.content;

        const actions = document.createElement("div");
        actions.className = "entry-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => {
            editEntry(entry.id);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => {
            deleteEntry(entry.id);
        });

        actions.append(editBtn, deleteBtn);
        card.append(title, date, content, actions);
        diaryEntries.appendChild(card);
    });
}

// =========================
// EDIT ENTRY
// =========================

function editEntry(id) {
    const entries = getEntries();
    const entry = entries.find(item => item.id === id);

    if (!entry) return;

    editingId = id;
    diaryTitle.value = entry.title;
    diaryContent.value = entry.content;

    saveEntryBtn.textContent = "Update Entry";
    cancelEditBtn.hidden = false;

    document.getElementById("diary").scrollIntoView({
        behavior: "smooth"
    });
}

// =========================
// DELETE ENTRY
// =========================

function deleteEntry(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this entry?"
    );

    if (!confirmed) return;

    const entries = getEntries().filter(
        entry => entry.id !== id
    );

    if (!saveEntries(entries)) return;

    if (editingId === id) {
        resetEditor();
    }

    renderEntries();
}

// =========================
// RESET EDITOR
// =========================

function resetEditor() {
    diaryTitle.value = "";
    diaryContent.value = "";
    editingId = null;

    saveEntryBtn.textContent = "Save Entry";
    cancelEditBtn.hidden = true;
}

cancelEditBtn.addEventListener("click", resetEditor);

// =========================
// DATE AND FOOTER
// =========================

function updateDate() {
    diaryDate.textContent =
        new Date().toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    
    document.getElementById("current-year").textContent =
        new Date().getFullYear();
}

// =========================
// INITIALIZE
// =========================

updateDate();
renderEntries();
