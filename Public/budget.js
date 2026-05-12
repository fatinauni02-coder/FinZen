// ── DATA STORE ──────────────────────────────────────────
// budgets: { Food: 500, Transport: 200, ... }
// expenses: [ { id, title, category, amount }, ... ]

let budgets = JSON.parse(localStorage.getItem('fz_budgets')) || {};
let expenses = JSON.parse(localStorage.getItem('fz_expenses')) || [];

function saveBudgets() {
    localStorage.setItem('fz_budgets', JSON.stringify(budgets));
}
function saveExpenses() {
    localStorage.setItem('fz_expenses', JSON.stringify(expenses));
}

// ── ON PAGE LOAD ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    renderExpenseTable();
    renderSummary();

    // ── SET BUDGET FORM ──────────────────────────────────
    document.getElementById('budgetForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const category = document.getElementById('budgetCategory').value;
        const amount = parseFloat(document.getElementById('budgetAmount').value);

        if (!amount || amount <= 0) {
            alert('Please enter a valid budget amount.');
            return;
        }

        budgets[category] = amount;
        saveBudgets();
        renderSummary();

        // Show feedback
        showToast(`Budget for ${category} set to RM ${amount.toFixed(2)}`);

        // Reset amount field only
        document.getElementById('budgetAmount').value = '';
    });

    // ── ADD EXPENSE FORM ─────────────────────────────────
    document.getElementById('expenseForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const title = document.getElementById('expenseTitle').value.trim();
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        const category = document.getElementById('expenseCategory').value;

        if (!title) {
            alert('Please enter an expense title.');
            return;
        }
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        const expense = {
            id: Date.now(),
            title,
            category,
            amount
        };

        expenses.push(expense);
        saveExpenses();
        renderExpenseTable();
        renderSummary();

        showToast(`Added: ${title} (RM ${amount.toFixed(2)})`);

        // Reset form
        document.getElementById('expenseForm').reset();
    });
});

// ── RENDER EXPENSE TABLE ─────────────────────────────────
function renderExpenseTable() {
    const tbody = document.getElementById('expenseTable');
    tbody.innerHTML = '';

    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; color:#6b7c5a; padding: 20px;">
                    No expenses added yet.
                </td>
            </tr>`;
        return;
    }

    expenses.forEach(function (exp) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHTML(exp.title)}</td>
            <td><span class="cat-badge cat-${exp.category.toLowerCase()}">${exp.category}</span></td>
            <td>RM ${exp.amount.toFixed(2)}</td>
            <td>
                <button class="btn-act btn-delete" onclick="deleteExpense(${exp.id})">🗑 Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ── DELETE EXPENSE ───────────────────────────────────────
function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    expenses = expenses.filter(function (e) { return e.id !== id; });
    saveExpenses();
    renderExpenseTable();
    renderSummary();
}

// ── RENDER SUMMARY ───────────────────────────────────────
function renderSummary() {
    const section = document.getElementById('summarySection');
    const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment'];

    // Calculate spent per category
    const spent = {};
    categories.forEach(function (cat) { spent[cat] = 0; });
    expenses.forEach(function (exp) {
        if (spent[exp.category] !== undefined) {
            spent[exp.category] += exp.amount;
        }
    });

    // Total row
    const totalBudget = categories.reduce(function (sum, cat) {
        return sum + (budgets[cat] || 0);
    }, 0);
    const totalSpent = categories.reduce(function (sum, cat) {
        return sum + spent[cat];
    }, 0);
    const totalLeft = totalBudget - totalSpent;

    let html = '';

    // Only show categories that have a budget OR have expenses
    const activeCategories = categories.filter(function (cat) {
        return budgets[cat] || spent[cat] > 0;
    });

    if (activeCategories.length === 0) {
        html = `<p style="color:#6b7c5a; text-align:center; padding:10px;">
                    Set a budget above to see your summary here.
                </p>`;
        section.innerHTML = html;
        return;
    }

    activeCategories.forEach(function (cat) {
        const budget = budgets[cat] || 0;
        const spentAmt = spent[cat];
        const left = budget - spentAmt;
        const pct = budget > 0 ? Math.min((spentAmt / budget) * 100, 100) : 0;

        let barColor = '#9AAB64';        // green — safe
        if (pct >= 100) barColor = '#AA333C';   // red — over budget
        else if (pct >= 75) barColor = '#c4824a'; // orange — warning

        const overBudget = spentAmt > budget && budget > 0;

        html += `
        <div class="summary-row">
            <div class="summary-top">
                <span class="summary-cat">${cat}</span>
                <span class="summary-nums">
                    <span style="color:#6b7c5a;">Spent: <strong>RM ${spentAmt.toFixed(2)}</strong></span>
                    &nbsp;/&nbsp;
                    <span style="color:#3C5227;">Budget: <strong>RM ${budget > 0 ? budget.toFixed(2) : '—'}</strong></span>
                    &nbsp;·&nbsp;
                    <span style="color:${overBudget ? '#AA333C' : '#3C5227'}; font-weight:600;">
                        ${budget > 0 ? (overBudget ? '⚠ Over by RM ' + Math.abs(left).toFixed(2) : 'RM ' + left.toFixed(2) + ' left') : ''}
                    </span>
                </span>
            </div>
            ${budget > 0 ? `
            <div class="progress-wrap">
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width:${pct}%; background:${barColor};"></div>
                </div>
                <span class="progress-pct" style="color:${barColor};">${pct.toFixed(0)}%</span>
            </div>` : ''}
        </div>`;
    });

    // Total summary
    html += `
    <div class="summary-total">
        <span>Total</span>
        <span>
            Spent: <strong>RM ${totalSpent.toFixed(2)}</strong> &nbsp;/&nbsp;
            Budget: <strong>RM ${totalBudget.toFixed(2)}</strong> &nbsp;·&nbsp;
            <span style="color:${totalLeft < 0 ? '#AA333C' : '#3C5227'}; font-weight:700;">
                ${totalLeft < 0 ? '⚠ Over by RM ' + Math.abs(totalLeft).toFixed(2) : 'RM ' + totalLeft.toFixed(2) + ' remaining'}
            </span>
        </span>
    </div>`;

    section.innerHTML = html;
}

// ── TOAST NOTIFICATION ───────────────────────────────────
function showToast(message) {
    // Remove existing toast if any
    const existing = document.getElementById('fz-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'fz-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 30px; right: 30px;
        background: #3C5227; color: #FBD3AC;
        padding: 12px 20px; border-radius: 10px;
        font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 9999; opacity: 0;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(toast);

    // Fade in
    setTimeout(function () { toast.style.opacity = '1'; }, 10);
    // Fade out after 2.5s
    setTimeout(function () {
        toast.style.opacity = '0';
        setTimeout(function () { toast.remove(); }, 300);
    }, 2500);
}

// ── HELPER ───────────────────────────────────────────────
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}