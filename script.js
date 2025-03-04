function calculateProfitLoss() {
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

const API_KEY = "RWLJXBUVVD5VOIRY"; // Replace with your actual API Key

async function fetchStockPrice() {
    let stockSymbol = document.getElementById("stock-symbol").value.toUpperCase();

    if (!stockSymbol) {
        alert("Please enter a stock symbol.");
        return;
    }

    let url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockSymbol}&apikey=${API_KEY}`;

    try {
        let response = await fetch(url);
        let data = await response.json();

        if (data["Global Quote"]) {
            let stockPrice = parseFloat(data["Global Quote"]["05. price"]).toFixed(2);
            document.getElementById("stock-price").innerText = `$${stockPrice}`;
        } else {
            document.getElementById("stock-price").innerText = "N/A";
            alert("Stock not found. Please check the symbol.");
        }
    } catch (error) {
        console.error("Error fetching stock price:", error);
        alert("Failed to fetch stock price. Try again later.");
    }
}

const RAPIDAPI_KEY = "45248586e8mshed5ff5735ca346ap1eb6f2jsn133e4ee390eb"; // Use your valid key

async function getStockChartData(symbol, interval = '1mo', range = '5y') {
    const url = `https://yh-finance.p.rapidapi.com/stock/v3/get-chart?interval=${interval}&symbol=${symbol}&range=${range}&region=US&includePrePost=false&useYfid=true&includeAdjustedClose=true&events=capitalGain%2Cdiv%2Csplit`;
    
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-host': 'yh-finance.p.rapidapi.com',
            'x-rapidapi-key': RAPIDAPI_KEY
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

/**
 * Attach Event Listeners for Chart Button
 */
document.getElementById("fetchData").addEventListener("click", () => {
    const symbol = document.getElementById("stockSymbol").value.toUpperCase();
    if (symbol) {
        displayStockChart(symbol);
    } else {
        alert("Please enter a stock symbol.");
    }
});
