let tips = [];
let favourites = [];
let currentCategory = "All";

const tipsContainer = document.getElementById("tipsContainer");
const favouriteContainer = document.getElementById("favouriteContainer");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

const tipForm = document.getElementById("tipForm");
const tipTitle = document.getElementById("tipTitle");
const tipCategory = document.getElementById("tipCategory");
const tipContent = document.getElementById("tipContent");
const formMessage = document.getElementById("formMessage");

async function loadTips() {
    try {
        const response = await fetch("/api/tips");
        tips = await response.json();
        displayTips();
    } catch (error) {
        tipsContainer.innerHTML = `<p class="text-danger">Failed to load financial tips.</p>`;
    }
}

function displayTips() {
    const searchText = searchInput.value.toLowerCase();

    const filteredTips = tips.filter(function(tip) {
        const matchesCategory = currentCategory === "All" || tip.category === currentCategory;

        const matchesSearch =
            tip.title.toLowerCase().includes(searchText) ||
            tip.content.toLowerCase().includes(searchText);

        return matchesCategory && matchesSearch;
    });

    tipsContainer.innerHTML = "";

    if (filteredTips.length === 0) {
        tipsContainer.innerHTML = `<p class="text-muted">No tips found.</p>`;
        return;
    }

    filteredTips.forEach(function(tip) {
        const isSaved = favourites.some(function(fav) {
            return fav.id === tip.id;
        });

        const tipCard = document.createElement("div");
        tipCard.className = "col-md-4";

        tipCard.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <span class="badge bg-success mb-2">${tip.category}</span>
                    <h5 class="card-title">${tip.title}</h5>
                    <p class="card-text">${tip.content}</p>
                    <button class="btn ${isSaved ? "btn-secondary" : "btn-outline-success"} btn-sm save-btn" data-id="${tip.id}">
                        ${isSaved ? "Saved" : "Save Tip"}
                    </button>
                </div>
            </div>
        `;

        tipsContainer.appendChild(tipCard);
    });

    addSaveButtonEvents();
}

function addSaveButtonEvents() {
    const saveButtons = document.querySelectorAll(".save-btn");

    saveButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            const tipId = Number(button.dataset.id);
            saveFavouriteTip(tipId);
        });
    });
}

function saveFavouriteTip(tipId) {
    const selectedTip = tips.find(function(tip) {
        return tip.id === tipId;
    });

    const alreadySaved = favourites.some(function(tip) {
        return tip.id === tipId;
    });

    if (!alreadySaved && selectedTip) {
        favourites.push(selectedTip);
    }

    displayTips();
    displayFavourites();
}

function displayFavourites() {
    favouriteContainer.innerHTML = "";

    if (favourites.length === 0) {
        favouriteContainer.innerHTML = `<p class="text-muted">No favourite tips saved yet.</p>`;
        return;
    }

    favourites.forEach(function(tip) {
        const favouriteCard = document.createElement("div");
        favouriteCard.className = "col-md-4";

        favouriteCard.innerHTML = `
            <div class="card h-100 border-success">
                <div class="card-body">
                    <span class="badge bg-success mb-2">${tip.category}</span>
                    <h5 class="card-title">${tip.title}</h5>
                    <p class="card-text">${tip.content}</p>
                    <button class="btn btn-danger btn-sm remove-btn" data-id="${tip.id}">
                        Remove
                    </button>
                </div>
            </div>
        `;

        favouriteContainer.appendChild(favouriteCard);
    });

    addRemoveButtonEvents();
}

function addRemoveButtonEvents() {
    const removeButtons = document.querySelectorAll(".remove-btn");

    removeButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            const tipId = Number(button.dataset.id);

            favourites = favourites.filter(function(tip) {
                return tip.id !== tipId;
            });

            displayTips();
            displayFavourites();
        });
    });
}

filterButtons.forEach(function(button) {
    button.addEventListener("click", function() {
        currentCategory = button.dataset.category;

        filterButtons.forEach(function(btn) {
            btn.classList.remove("btn-success");
            btn.classList.add("btn-outline-success");
        });

        button.classList.remove("btn-outline-success");
        button.classList.add("btn-success");

        displayTips();
    });
});

searchInput.addEventListener("input", function() {
    displayTips();
});

tipForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const title = tipTitle.value.trim();
    const category = tipCategory.value;
    const content = tipContent.value.trim();

    if (title === "" || category === "" || content === "") {
        formMessage.textContent = "Please fill in all fields before submitting.";
        formMessage.style.color = "red";
        return;
    }

    const newTip = {
        title: title,
        category: category,
        content: content
    };

    try {
        const response = await fetch("/api/tips", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newTip)
        });

        const result = await response.json();

        if (response.ok) {
            formMessage.textContent = result.message;
            formMessage.style.color = "green";

            tipForm.reset();
            loadTips();
        } else {
            formMessage.textContent = result.message;
            formMessage.style.color = "red";
        }
    } catch (error) {
        formMessage.textContent = "Something went wrong while submitting the tip.";
        formMessage.style.color = "red";
    }
});

loadTips();
displayFavourites();