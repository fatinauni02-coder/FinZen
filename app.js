const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// File paths
const tipsFilePath = path.join(__dirname, "data", "tips.json");
const goalsFilePath = path.join(__dirname, "data", "goal.json");
const profileFilePath = path.join(__dirname, "data", "profile.json"); 

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static('./'));

// ============ PROFILE API ============
// Read profile from JSON file
function readProfile() {
    try {
        const data = fs.readFileSync(profileFilePath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, create default profile structure
        const defaultProfile = {
            name: "John Doe",
            email: "john@email.com",
            phone: "012-3456789",
            password: "", // In production, this should be hashed!
            summary: "Savings: RM10,000 | Active Goals: 4",
            joinDate: new Date().toISOString().split("T")[0]
        };
        
        // Make sure data folder exists
        const dataDir = path.join(__dirname, "data");
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        
        fs.writeFileSync(profileFilePath, JSON.stringify(defaultProfile, null, 2));
        return defaultProfile;
    }
}

// Save profile into JSON file
function saveProfile(profile) {
    fs.writeFileSync(profileFilePath, JSON.stringify(profile, null, 2));
}

// Get profile
app.get("/profile", (req, res) => {
    try {
        const profile = readProfile();
        // Don't send password back to client for security
        const { password, ...safeProfile } = profile;
        res.json(safeProfile);
    } catch (error) {
        res.status(500).json({ error: "Failed to read profile" });
    }
});

// Update profile
app.post("/update-profile", (req, res) => {
    try {
        const profile = readProfile();
        const { name, email, phone, password } = req.body;
        
        // Update only the fields that are provided
        if (name) profile.name = name;
        if (email) profile.email = email;
        if (phone) profile.phone = phone;
        if (password && password.trim() !== "") profile.password = password;
        
        saveProfile(profile);
        
        // Return safe profile without password
        const { password: pwd, ...safeProfile } = profile;
        res.json({ 
            message: "Profile updated successfully",
            profile: safeProfile 
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// Delete user account
app.delete("/user", (req, res) => {
    try {
        // Reset profile to default values instead of deleting
        const defaultProfile = {
            name: "User",
            email: "",
            phone: "",
            password: "",
            summary: "Savings: RM0 | Active Goals: 0",
            joinDate: new Date().toISOString().split("T")[0]
        };
        
        saveProfile(defaultProfile);
        res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete account" });
    }
});

// ============ TIPS API ============
// Read tips from JSON file
function readTips() {
    const data = fs.readFileSync(tipsFilePath, "utf8");
    return JSON.parse(data);
}

// Save tips into JSON file
function saveTips(tips) {
    fs.writeFileSync(tipsFilePath, JSON.stringify(tips, null, 2));
}

// Get all financial tips
app.get("/api/tips", function(req, res) {
    try {
        const tips = readTips();
        res.json(tips);
    } catch (error) {
        res.status(500).json({ message: "Failed to read tips." });
    }
});

// Add new user tip
app.post("/api/tips", function(req, res) {
    try {
        const tips = readTips();

        const newTip = {
            id: tips.length > 0 ? tips[tips.length - 1].id + 1 : 1,
            title: req.body.title,
            category: req.body.category,
            content: req.body.content,
            submittedBy: "User",
            createdAt: new Date().toISOString().split("T")[0]
        };

        tips.push(newTip);
        saveTips(tips);

        res.json({
            message: "Tip submitted successfully.",
            tip: newTip
        });
    } catch (error) {
        res.status(400).json({ message: "Failed to submit tip." });
    }
});

// ============ SAVINGS GOALS API ============
// Read goals from JSON file
function readGoals() {
    try {
        const data = fs.readFileSync(goalsFilePath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, create default structure
        const defaultData = {
            goals: [],
            profile: {
                userName: "User",
                joinDate: new Date().toISOString().split("T")[0]
            }
        };
        // Make sure data folder exists
        const dataDir = path.join(__dirname, "data");
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        fs.writeFileSync(goalsFilePath, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
}

// Save goals into JSON file
function saveGoals(data) {
    fs.writeFileSync(goalsFilePath, JSON.stringify(data, null, 2));
}

// Get all goals
app.get("/api/goals", (req, res) => {
    try {
        const data = readGoals();
        res.json(data.goals);
    } catch (error) {
        res.status(500).json({ error: "Failed to read goals" });
    }
});

// Create new goal
app.post("/api/goals", (req, res) => {
    try {
        const data = readGoals();
        const newGoal = { 
            ...req.body, 
            id: generateShortId(), 
            saved: 0 
        };
        data.goals.push(newGoal);
        saveGoals(data);
        res.json(newGoal);
    } catch (error) {
        res.status(500).json({ error: "Failed to create goal" });
    }
});

// Helper function to generate short string IDs (like "eWsD8sN")
function generateShortId() {
    return Math.random().toString(36).substring(2, 9);
}

// Update goal
app.patch("/api/goals/:id", (req, res) => {
    try {
        const data = readGoals();
        const id = req.params.id;                   
        const goalIndex = data.goals.findIndex(g => String(g.id) === id);  
        
        if (goalIndex !== -1) {
            data.goals[goalIndex] = { ...data.goals[goalIndex], ...req.body };
            saveGoals(data);
            res.json(data.goals[goalIndex]);
        } else {
            res.status(404).json({ error: "Goal not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to update goal" });
    }
});

// Delete goal
app.delete("/api/goals/:id", (req, res) => {
    try {
        const data = readGoals();
        const id = req.params.id;                    // ← keep as string
        data.goals = data.goals.filter(g => String(g.id) !== id);   // ← compare strings
        saveGoals(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete goal" });
    }
});
	
app.get("/profile", (req, res) => {
    try {
        const data = readGoals();
        res.json(data.profile);
    } catch (error) {
        res.status(500).json({ error: "Failed to read profile" });
    }
});

// Start server
app.listen(PORT, function() {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`- Profile API: http://localhost:${PORT}/profile`);
    console.log(`- Goals API: http://localhost:${PORT}/goals`);
    console.log(`- Tips API: http://localhost:${PORT}/api/tips`);
});