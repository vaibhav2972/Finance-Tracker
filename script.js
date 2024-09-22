let budget = 0;
let expenses = [];
let savingsGoal = 0;
let chartInstance;
let trendsChartInstance;

// Load data from localStorage on page load
window.onload = () => {
  budget = parseFloat(localStorage.getItem("budget")) || 0;
  expenses = JSON.parse(localStorage.getItem("expenses")) || [];
  savingsGoal = parseFloat(localStorage.getItem("savingsGoal")) || 0;

  updateBudgetDisplay();
  renderExpenses();
  updateCharts();
  updateSavingsGoal();
  updateMonthlyTrends();
};

// Function to set the budget
document.getElementById("set-budget").addEventListener("click", () => {
  const newBudget = parseFloat(document.getElementById("budget").value);
  if (!isNaN(newBudget) && newBudget > 0) {
    budget = newBudget;
    localStorage.setItem("budget", budget);
    updateBudgetDisplay();
  } else {
    alert("Please enter a valid budget greater than zero.");
    return;
  }
});

// Function to update the budget display
function updateBudgetDisplay() {
  document.getElementById("display-budget").textContent = `Rs. ${budget.toFixed(
    2
  )}`;
  updateRemainingBudget();
  updateSavingsGoal();
}

// Function to update the total expenses and remaining budget
function updateRemainingBudget() {
  const totalExpenses = expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );
  document.getElementById(
    "total-expenses"
  ).textContent = `Rs. ${totalExpenses.toFixed(2)}`;
  const remainingBudget = budget - totalExpenses;
  document.getElementById(
    "remaining-budget"
  ).textContent = `Rs. ${remainingBudget.toFixed(2)}`;

  if (totalExpenses > budget) {
    alert("Warning: Your expenses have exceeded your budget!");
  }
}

// Function to add an expense
document.getElementById("add-expense").addEventListener("click", () => {
  const category = document.getElementById("category").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const description = document.getElementById("description").value;
  const currentMonth = new Date().getMonth();
  if (!category || isNaN(amount) || amount <= 0) {
    alert("Please fill in all fields with valid values.");
    return;
  }
  if (!isNaN(amount) && amount > 0 && amount <= budget) {
    if (description.length > 0) {
      expenses.push({ category, amount, description });
      localStorage.setItem("expenses", JSON.stringify(expenses));
      const monthlyExpenses =
        JSON.parse(localStorage.getItem("monthlyExpenses")) ||
        Array(12).fill(0);
      monthlyExpenses[currentMonth] += amount;
      localStorage.setItem("monthlyExpenses", JSON.stringify(monthlyExpenses));
      renderExpenses();
      updateMonthlyTrends();
      updateSavingsGoal();
    } else {
      alert("Description cannot be empty.");
    }
  } else {
    alert(
      "Amount must be a positive number and less than or equal to the budget."
    );
  }
});

// Function to remove an expense
function removeExpense(index) {
  const removedExpense = expenses[index];
  expenses.splice(index, 1);
  localStorage.setItem("expenses", JSON.stringify(expenses));
  const monthlyExpenses =
    JSON.parse(localStorage.getItem("monthlyExpenses")) || Array(12).fill(0);
  const currentMonth = new Date().getMonth();
  monthlyExpenses[currentMonth] -= removedExpense.amount;
  localStorage.setItem("monthlyExpenses", JSON.stringify(monthlyExpenses));
  renderExpenses();
  updateMonthlyTrends();
  updateSavingsGoal();
}

// Function to edit an expense
function editExpense(index) {
  const expense = expenses[index];
  const newAmount = parseFloat(prompt("Enter new amount:", expense.amount));
  const newDescription = prompt("Enter new description:", expense.description);
  if (!isNaN(newAmount) && newAmount > 0 && newAmount <= budget) {
    const totalExpenses =
      expenses.reduce((total, exp) => total + exp.amount, 0) - expense.amount;
    if (totalExpenses + newAmount <= budget) {
      expenses[index] = {
        ...expense,
        amount: newAmount,
        description: newDescription,
      };
      localStorage.setItem("expenses", JSON.stringify(expenses));
      const monthlyExpenses =
        JSON.parse(localStorage.getItem("monthlyExpenses")) ||
        Array(12).fill(0);
      const currentMonth = new Date().getMonth();
      monthlyExpenses[currentMonth] =
        monthlyExpenses[currentMonth] - expense.amount + newAmount;
      localStorage.setItem("monthlyExpenses", JSON.stringify(monthlyExpenses));
      renderExpenses();
      updateMonthlyTrends();
      updateSavingsGoal();
    } else {
      alert("The new amount exceeds the available budget.");
    }
  } else {
    alert(
      "Amount must be a positive number and less than or equal to the budget."
    );
  }
}

// Function to render the expense list
function renderExpenses() {
  const expenseList = document.getElementById("expense-list");
  expenseList.innerHTML = "";

  expenses.forEach((expense, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${expense.category}</span>
      <span>Rs. ${expense.amount.toFixed(2)}</span>
      <span>${expense.description}</span>
      <div>
        <button class="edit-btn" onclick="editExpense(${index})">Edit</button>
        <button class="remove-btn" onclick="removeExpense(${index})">Remove</button>
      </div>
    `;
    expenseList.appendChild(li);
  });

  updateRemainingBudget();
  updateCharts();
  updateMonthlyTrends();
}

// Function to display doughnut chart
function updateCharts() {
  const ctx = document.getElementById("expense-chart").getContext("2d");
  const categories = [...new Set(expenses.map((exp) => exp.category))];
  const data = categories.map((cat) => {
    return expenses
      .filter((exp) => exp.category === cat)
      .reduce((sum, exp) => sum + exp.amount, 0);
  });

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categories,
      datasets: [
        {
          data: data,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#F7797D",
          ],
          borderColor: "#fff",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return `${tooltipItem.label}: Rs. ${tooltipItem.raw.toFixed(2)}`;
            },
          },
        },
      },
    },
  });
}

// Function to set and track monthly budget
document.getElementById("add-monthly-expense").addEventListener("click", () => {
  const monthSelector = document.getElementById("month-selector");
  const month = parseInt(monthSelector.value);
  const monthlyExpense = parseFloat(
    document.getElementById("monthly-expense").value
  );

  const currentMonth = new Date().getMonth();

  if (month >= currentMonth) {
    alert("You cannot add expenses for the current or future months.");
  } else if (!isNaN(monthlyExpense) && monthlyExpense > 0) {
    const currentExpenses =
      JSON.parse(localStorage.getItem(`monthlyExpenses`)) || Array(12).fill(0);
    const monthIndex = month;

    currentExpenses[monthIndex] += monthlyExpense;
    localStorage.setItem(`monthlyExpenses`, JSON.stringify(currentExpenses));

    alert("Monthly expense added successfully.");

    updateMonthlyTrends();
  } else {
    alert("Expense amount must be a positive number.");
  }
});

// Function to display monthly expenses trend
function updateMonthlyTrends() {
  const ctx = document.getElementById("trends-chart").getContext("2d");
  const monthlyExpenses =
    JSON.parse(localStorage.getItem("monthlyExpenses")) || Array(12).fill(0);
  if (trendsChartInstance) {
    trendsChartInstance.destroy();
  }

  const averageMonthlyExpense =
    monthlyExpenses.reduce((total, exp) => total + exp, 0) /
    monthlyExpenses.length;

  const getCurrentMonth = new Date().getMonth();
  const nextFirstMonth = (getCurrentMonth + 1) % 12;
  const nextSecondMonth = (getCurrentMonth + 2) % 12;

  const averageMonthlyArray = Array(12).fill(0);
  averageMonthlyArray[getCurrentMonth] = averageMonthlyExpense;
  averageMonthlyArray[nextFirstMonth] = averageMonthlyExpense;
  averageMonthlyArray[nextSecondMonth] = averageMonthlyExpense;

  const filteredAverageArray = averageMonthlyArray.map((value) =>
    value > 0 ? value : null
  );
  getCurrentMonth - 1 >= 0
    ? (filteredAverageArray[getCurrentMonth - 1] = 0)
    : null;
  nextSecondMonth + 1 <= 11
    ? (filteredAverageArray[nextSecondMonth + 1] = 0)
    : null;

  trendsChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Monthly Expenses",
          data: monthlyExpenses,
          borderColor: "#FF6384",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderWidth: 2,
        },
        {
          label: "Predicted Monthly Expenses",
          data: filteredAverageArray,
          borderColor: "#36A2EB",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderWidth: 2,
          borderDash: [10, 5],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Function to set savings goal
document.getElementById("set-goal").addEventListener("click", () => {
  const newGoal = parseFloat(
    document.getElementById("savings-goal-input").value
  );
  if (!isNaN(newGoal) && newGoal > 0) {
    savingsGoal = newGoal;
    localStorage.setItem("savingsGoal", savingsGoal);
    updateSavingsGoal();
  }
});

// Function to update savings goal progress
function updateSavingsGoal() {
  const goalDisplay = document.getElementById("savings-goal-display");

  if (savingsGoal > 0 && budget > 0) {
    const totalExpenses = expenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );
    const remainingBudget = budget - totalExpenses;
    if (remainingBudget < savingsGoal) {
      alert(
        "You have not achieved your savings goal! Remaining budget is less than the savings goal."
      );
    }

    goalDisplay.textContent = `Rs. ${savingsGoal.toFixed(2)}`;
  }
}

// Function to fetch and do currency conversion
document
  .getElementById("convert-currency")
  .addEventListener("click", async function currencyConversion() {
    try {
      const budget = localStorage.getItem("budget");
      const totalExpenses = expenses.reduce(
        (total, expense) => total + expense.amount,
        0
      );
      const currency = document.getElementById("currency-selector").value;
      const data = await fetch(
        "https://api.exchangerate-api.com/v4/latest/INR"
      );
      const response = await data.json();
      const exchangeRate = response.rates[currency];
      if (exchangeRate) {
        const convertedBudget = budget * exchangeRate;
        const convertedExpense = totalExpenses * exchangeRate;
        document.getElementById(
          "converted-budget"
        ).textContent = `${currency} ${convertedBudget.toFixed(2)}`;
        document.getElementById(
          "converted-expense"
        ).textContent = `${currency} ${convertedExpense.toFixed(2)}`;
      }
    } catch (error) {
      alert("Currency conversion failed. Please try again later.");
    }
  });

// Function to export data to CSV
document.getElementById("export-csv").addEventListener("click", () => {
  if (expenses.length === 0) {
    alert("No data available to export.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Category,Amount,Description\n";

  expenses.forEach((expense) => {
    csvContent += `${expense.category},${expense.amount.toFixed(2)},${
      expense.description
    }\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "expenses.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
