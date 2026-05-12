const nameDisplay = document.querySelector("#userName");
const emailDisplay = document.querySelector("#userEmail");
const phoneDisplay = document.querySelector("#userPhone");
const summaryDisplay = document.querySelector("#financialSummary");

// Input fields from the form
const nameInput = document.querySelector("#nameInput");
const emailInput = document.querySelector("#emailInput");
const phoneInput = document.querySelector("#phoneInput");
const passwordInput = document.querySelector("#passwordInput");

const profileForm = document.querySelector("#profileForm");

async function loadProfile() {
    try {
        const res = await fetch("/profile");
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();

        // Update display elements with data from backend
        nameDisplay.textContent = data.name || "Not set";
        emailDisplay.textContent = data.email || "Not set";
        phoneDisplay.textContent = data.phone || "Not set";
        summaryDisplay.textContent = data.summary || "Savings: RM0 | Active Goals: 0";

        // Populate form inputs for editing
        nameInput.value = data.name || "";
        emailInput.value = data.email || "";
        phoneInput.value = data.phone || "";
        
    } catch (error) {
        console.error("Failed to load profile:", error);
        nameDisplay.textContent = "Error loading profile";
        emailDisplay.textContent = "Please check your connection";
        phoneDisplay.textContent = "";
        summaryDisplay.textContent = "Unable to load data";
    }
}

profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        name: nameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        password: passwordInput.value
    };

    try {
        const res = await fetch("/update-profile", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const result = await res.json();
        
        // Clear password field after update
        passwordInput.value = "";
        
        // Reload to update display with new data
        await loadProfile();
        
        alert(result.message || "Profile updated successfully!");
        
    } catch (error) {
        console.error("Failed to update profile:", error);
        alert("Failed to update profile. Please try again.");
    }
});

document.querySelector("#deleteBtn").addEventListener("click", async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
        try {
            const res = await fetch("/user", { method: "DELETE" });
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const result = await res.json();
            alert(result.message || "Account deleted successfully");
            window.location.href = "login.html";
            
        } catch (error) {
            console.error("Failed to delete account:", error);
            alert("Failed to delete account. Please try again.");
        }
    }
});

// Load profile data when page loads
loadProfile();