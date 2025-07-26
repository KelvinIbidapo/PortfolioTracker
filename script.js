calculateProfitLoss() {
    // Get input values
    let investment = parseFloat(document.getElementById("investment").value);
    let shares = parseFloat(document.getElementById("shares").value);
    let buyPrice = parseFloat(document.getElementById("buy-price").value);
    let sellPrice = parseFloat(document.getElementById("sell-price").value);

    // Check if inputs are valid numbers
    if (isNaN(investment) || isNaN(shares) || isNaN(buyPrice) || isNaN(sellPrice) ||
        investment <= 0 || shares <= 0 || buyPrice <= 0) {
        alert("Please enter valid positive numbers.");
        return;
    }

    // Calculate total cost and total sell value
    let totalCost = shares * buyPrice;
    let totalSellValue = shares * sellPrice;

    // Calculate profit or loss
    let profit = totalSellValue - totalCost;
    let loss = profit < 0 ? Math.abs(profit) : 0;
    let profitPercentage = ((profit / totalCost) * 100).toFixed(2);

    // Update values in the HTML
    document.getElementById("profit-result").innerText = profit > 0 ? profit.toFixed(2) : "0";
    document.getElementById("loss-result").innerText = loss > 0 ? loss.toFixed(2) : "0";
    document.getElementById("percent-result").innerText = profitPercentage + "%";
}

const API_KEY = "XXXXXXX"; // Replace with your actual API Key

async function fetchStockPrice() {
    let stockSymbol = document.getElementById("stockSymbol").value.toUpperCase();

    if (!stockSymbol) {
        alert("Please enter a stock symbol.");
        return;
    }

    let url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockSymbol}&apikey=${API_KEY}`;

    try {
        let response = await fetch(url);
        let data = await response.json();

        if (data["Global Quote"] && data["Global Quote"]["05. price"]) {
            let stockPrice = parseFloat(data["Global Quote"]["05. price"]).toFixed(2);
            document.getElementById("stockPrice").innerText = `$${stockPrice}`;
        } else {
            document.getElementById("stockPrice").innerText = "N/A";
            alert("Stock not found. Please check the symbol.");
        }
    } catch (error) {
        console.error("Error fetching stock price:", error);
        alert("Failed to fetch stock price. Try again later.");
    }
}


const RAPIDAPI_KEY = "YOUR_RAPIDAPI_KEY_HERE"; // 🔐 Replace WITH API KEY

async function getStockChartData(symbol, interval = '1mo', range = '5y') {
    const url = `https://yh-finance.p.rapidapi.com/stock/v3/get-chart?interval=${interval}&symbol=${symbol}&range=${range}&region=US&includePrePost=false&useYfid=true&includeAdjustedClose=true&events=capitalGain%2Cdiv%2Csplit`;
    
    const options = {
    method: 'GET',
    headers: {
        'x-rapidapi-host': 'yh-finance.p.rapidapi.com',
        'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY_HERE' // 🔐 DO THIS BEFORE GITHUB PUSH
    }
};


    try {
        const response = await fetch(url, options);
        const data = await response.json();

        // Ensure data exists before processing
        if (!data || !data.chart || !data.chart.result || data.chart.result.length === 0) {
            alert("No data available for this stock symbol.");
            return null;
        }

        return data.chart.result[0]; // Return relevant stock chart data
    } catch (error) {
        console.error("Error fetching stock data:", error);
        alert("Failed to fetch stock data. Check API key and symbol.");
        return null;
    }
}

/**
 * Display Stock Chart with Chart.js
 */
async function displayStockChart(symbol) {
    const stockData = await getStockChartData(symbol);
    
    if (!stockData) return;

    // Extract timestamps and closing prices
    const timestamps = stockData.timestamp.map(t => new Date(t * 1000).toLocaleDateString());
    const prices = stockData.indicators.quote[0].close;

    const ctx = document.getElementById("stockChart").getContext("2d");

    // Destroy old chart if it exists
    if (window.stockChartInstance) {
        window.stockChartInstance.destroy();
    }

    // Create new chart
    window.stockChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: timestamps,
            datasets: [{
                label: `${symbol} Stock Price`,
                data: prices,
                borderColor: "blue",
                backgroundColor: "rgba(0, 0, 255, 0.1)",
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    loadPortfolio();
    setInterval(fetchLivePrices, 10000); // Auto-refresh prices every 10 seconds
});

/**
 * ✅ Add Investment Function
 */
window.addInvestment = function () {
    console.log("✅ Add Investment function is running");

    const assetType = document.getElementById("assetType").value;
    const symbol = document.getElementById("symbol").value.trim().toUpperCase();
    const quantity = parseFloat(document.getElementById("quantity").value);
    const buyPrice = parseFloat(document.getElementById("buyPrice").value);

    if (!symbol || isNaN(quantity) || isNaN(buyPrice) || quantity <= 0 || buyPrice <= 0) {
        alert("⚠️ Please enter valid details.");
        return;
    }

    let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];

    // Check if investment already exists
    let existingInvestment = portfolio.find(item => item.symbol === symbol);
    if (existingInvestment) {
        if (confirm("Investment already exists. Do you want to update quantity and price?")) {
            existingInvestment.quantity += quantity;
            existingInvestment.buyPrice = buyPrice;
            localStorage.setItem("portfolio", JSON.stringify(portfolio));
            loadPortfolio();
            updatePortfolioChart();
            return;
        } else {
            return;
        }
    }

    // Add new investment
    portfolio.push({ assetType, symbol, quantity, buyPrice });
    localStorage.setItem("portfolio", JSON.stringify(portfolio));

    loadPortfolio();
    updatePortfolioChart();

    // Clear input fields
    document.getElementById("symbol").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("buyPrice").value = "";

    console.log("✅ Investment successfully added:", portfolio);
};

/**
 * ✅ Load Portfolio & Display Total Value
 */
function loadPortfolio() {
    console.log("🔄 Loading portfolio...");
    
    const portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
    const tableBody = document.getElementById("portfolioTable");
    if (!tableBody) {
        console.error("⚠️ Portfolio table not found in DOM");
        return;
    }

    tableBody.innerHTML = "";
    let totalInvestment = 0;
    let totalProfitLoss = 0;

    if (portfolio.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No investments found</td></tr>`;
        document.getElementById("totalInvestment").innerText = `$0.00`;
        document.getElementById("totalProfitLoss").innerText = `$0.00`;
        return;
    }

    portfolio.forEach((investment, index) => {
        totalInvestment += investment.quantity * investment.buyPrice;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${investment.assetType}</td>
            <td>${investment.symbol}</td>
            <td>${investment.quantity}</td>
            <td>$${investment.buyPrice.toFixed(2)}</td>
            <td id="price-${investment.symbol}">Loading...</td>
            <td id="profit-${investment.symbol}">Calculating...</td>
            <td><button onclick="removeInvestment(${index})">Remove</button></td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById("totalInvestment").innerText = `$${totalInvestment.toFixed(2)}`;
    document.getElementById("totalProfitLoss").innerText = `$${totalProfitLoss.toFixed(2)}`;

    fetchLivePrices(); // ✅ Fetch stock prices if there are investments
}

/**
 * ✅ Fetch Live Prices & Update Portfolio
 */
async function fetchLivePrices() {
    console.log("📡 Fetching live prices...");
    const portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];

    if (portfolio.length === 0) return;

    const symbols = portfolio.map(item => item.symbol).join(",");

    const RAPIDAPI_KEY = "YOUR_RAPIDAPI_KEY_HERE"; // Replace with your actual key before running

    try {
    const response = await fetch(`https://yahoo-finance-real-time1.p.rapidapi.com/market/get-quotes?region=US&symbols=${symbols}`, {
        method: "GET",
        headers: {
            "x-rapidapi-host": "yahoo-finance-real-time1.p.rapidapi.com",
            "x-rapidapi-key": RAPIDAPI_KEY // ✅ Use variable instead of hardcoding
        }
        });


        const data = await response.json();

        if (!data || !data.quotes) {
            console.error("⚠️ No valid stock data received");
            return;
        }

        let totalProfitLoss = 0;

        portfolio.forEach(investment => {
            const stockData = data.quotes.find(q => q.symbol === investment.symbol);
            if (stockData && stockData.regularMarketPrice) {
                const currentPrice = stockData.regularMarketPrice;
                const profitLoss = ((currentPrice - investment.buyPrice) * investment.quantity).toFixed(2);
                totalProfitLoss += parseFloat(profitLoss);

                document.getElementById(`price-${investment.symbol}`).textContent = `$${currentPrice.toFixed(2)}`;
                document.getElementById(`profit-${investment.symbol}`).textContent = `$${profitLoss}`;
            } else {
                console.warn(`⚠️ No valid price found for ${investment.symbol}`);
                document.getElementById(`price-${investment.symbol}`).textContent = "N/A";
                document.getElementById(`profit-${investment.symbol}`).textContent = "N/A";
            }
        });

        document.getElementById("totalProfitLoss").innerText = `$${totalProfitLoss.toFixed(2)}`;
    } catch (error) {
        console.error("❌ Error fetching live prices:", error);
    }
}

/**
 * ✅ Remove Investment
 */
window.removeInvestment = function (index) {
    console.log("🗑️ Removing investment at index:", index);

    let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
    portfolio.splice(index, 1);
    localStorage.setItem("portfolio", JSON.stringify(portfolio));

    loadPortfolio();
};

/**
 * ✅ Graphical Portfolio Breakdown (Pie Chart)
 */
function updatePortfolioChart() {
    const portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];

    if (portfolio.length === 0) return;

    let assetDistribution = { stock: 0, crypto: 0, option: 0 };

    portfolio.forEach(investment => {
        assetDistribution[investment.assetType] += investment.quantity * investment.buyPrice;
    });

    const ctx = document.getElementById("priceChart").getContext("2d");

    if (window.portfolioChartInstance) {
        window.portfolioChartInstance.destroy();
    }

    window.portfolioChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Stocks", "Crypto", "Options"],
            datasets: [{
                data: [assetDistribution.stock, assetDistribution.crypto, assetDistribution.option],
                backgroundColor: ["blue", "orange", "green"]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}




function addBudgetItem() {
    const category = document.getElementById("category").value.trim();
    const budgeted = parseFloat(document.getElementById("budgetAmount").value);
    const actual = parseFloat(document.getElementById("actualAmount").value);

    if (!category || isNaN(budgeted) || isNaN(actual) || budgeted <= 0 || actual < 0) {
        alert("Please enter valid details.");
        return;
    }

    let budget = JSON.parse(localStorage.getItem("budget")) || [];
    budget.push({ category, budgeted, actual });

    localStorage.setItem("budget", JSON.stringify(budget));
    loadBudget();
    
    document.getElementById("category").value = "";
    document.getElementById("budgetAmount").value = "";
    document.getElementById("actualAmount").value = "";
}

function loadBudget() {
    const budget = JSON.parse(localStorage.getItem("budget")) || [];
    const tableBody = document.getElementById("budgetTable");
    tableBody.innerHTML = "";

    let totalBudgeted = 0;
    let totalSpent = 0;

    budget.forEach((item, index) => {
        totalBudgeted += item.budgeted;
        totalSpent += item.actual;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.category}</td>
            <td>$${item.budgeted.toFixed(2)}</td>
            <td>$${item.actual.toFixed(2)}</td>
            <td>$${(item.budgeted - item.actual).toFixed(2)}</td>
            <td><button onclick="removeBudgetItem(${index})">Remove</button></td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById("totalBudgeted").innerText = totalBudgeted.toFixed(2);
    document.getElementById("totalSpent").innerText = totalSpent.toFixed(2);
    document.getElementById("remainingBalance").innerText = (totalBudgeted - totalSpent).toFixed(2);

    updateBudgetChart(budget);
}

function removeBudgetItem(index) {
    let budget = JSON.parse(localStorage.getItem("budget")) || [];
    budget.splice(index, 1);
    localStorage.setItem("budget", JSON.stringify(budget));
    loadBudget();
}

function updateBudgetChart(budget) {
    const ctx = document.getElementById("budgetChart").getContext("2d");

    if (window.budgetChartInstance) {
        window.budgetChartInstance.destroy();
    }

    const labels = budget.map(item => item.category);
    const amounts = budget.map(item => item.actual);

    window.budgetChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: amounts,
                backgroundColor: ["red", "blue", "green", "yellow", "purple"],
            }]
        }
    });
}

function calculateBudget() {
    const income = parseFloat(document.getElementById("income").value) || 0;
    const loanPayment = parseFloat(document.getElementById("loanPayment").value) || 0;
    const rent = parseFloat(document.getElementById("rent").value) || 0;
    const utilities = parseFloat(document.getElementById("utilities").value) || 0;
    const groceries = parseFloat(document.getElementById("groceries").value) || 0;
    const transportation = parseFloat(document.getElementById("transportation").value) || 0;
    const savings = parseFloat(document.getElementById("savings").value) || 0;
    const discretionary = parseFloat(document.getElementById("discretionary").value) || 0;
  
    const totalExpenses = loanPayment + rent + utilities + groceries + transportation + savings + discretionary;
    const buffer = income - totalExpenses;
  
    const percent = (amount) => ((amount / income) * 100).toFixed(1);
  
    document.getElementById("result").innerHTML = `
      <table>
        <tr><th>Category</th><th>Amount</th><th>% of Income</th></tr>
        <tr><td>Loan Payment</td><td>$${loanPayment}</td><td>${percent(loanPayment)}%</td></tr>
        <tr><td>Rent</td><td>$${rent}</td><td>${percent(rent)}%</td></tr>
        <tr><td>Utilities</td><td>$${utilities}</td><td>${percent(utilities)}%</td></tr>
        <tr><td>Groceries</td><td>$${groceries}</td><td>${percent(groceries)}%</td></tr>
        <tr><td>Transportation</td><td>$${transportation}</td><td>${percent(transportation)}%</td></tr>
        <tr><td>Savings</td><td>$${savings}</td><td>${percent(savings)}%</td></tr>
        <tr><td>Discretionary</td><td>$${discretionary}</td><td>${percent(discretionary)}%</td></tr>
        <tr><td><strong>Leftover Buffer</strong></td><td><strong>$${buffer.toFixed(2)}</strong></td><td><strong>${percent(buffer)}%</strong></td></tr>
      </table>
    `;
  }
  

// 🎯 Risk Assessment Quiz Logic
function calculateRisk() {
    let timeHorizon = document.getElementById("timeHorizon").value;
    let riskTolerance = document.getElementById("riskTolerance").value;
    let portfolioResult = document.getElementById("portfolioResult");

    let allocation = {};

    if (timeHorizon === "short" || riskTolerance === "low") {
        allocation = {
            "Bonds/Fixed Income": "70%",
            "Index ETFs (SPY, VOO)": "20%",
            "Growth Stocks": "10%"
        };
    } else if (timeHorizon === "medium" || riskTolerance === "medium") {
        allocation = {
            "Index ETFs (SPY, QQQ, VOO)": "50%",
            "Growth Stocks (TSLA, AAPL, NVDA)": "30%",
            "Crypto (BTC, ETH)": "20%"
        };
    } else {
        allocation = {
            "Growth Stocks (TSLA, AAPL, NVDA)": "50%",
            "Crypto (BTC, ETH, SOL)": "30%",
            "Index ETFs (VOO, QQQ)": "20%"
        };
    }

    portfolioResult.innerHTML = `<h3>Your Suggested Portfolio:</h3><ul>` +
        Object.entries(allocation).map(([key, value]) => `<li>${key}: ${value}</li>`).join('') +
        `</ul>`;

    updateChart(allocation);
}

// 📊 Portfolio Performance Chart
function updateChart(allocation) {
    const ctx = document.getElementById("portfolioChart").getContext("2d");

    if (window.portfolioChartInstance) {
        window.portfolioChartInstance.destroy();
    }

    window.portfolioChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(allocation),
            datasets: [{
                data: Object.values(allocation).map(val => parseFloat(val)),
                backgroundColor: ["blue", "green", "red", "yellow", "purple"]
            }]
        }
    });
}
