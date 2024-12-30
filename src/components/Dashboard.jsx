import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import monthlyData from "../data";

const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return localStorage.getItem("selectedMonth") || "January";
  });
  const [sharesInHand, setSharesInHand] = useState({});
  const [cashInHand, setCashInHand] = useState(0);
  const [amountPurchased, setAmountPurchased] = useState(0);
  const [amountSold, setAmountSold] = useState(0);
  const [profitLoss, setProfitLoss] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [remainingInShares, setRemainingInShares] = useState(0);

  const calculateSummary = (selectedMonth) => {
    let shares = {};
    let cash = 0;
    let purchased = 0;
    let sold = 0;
    let profitLoss = 0;
    let remainingInShares = 0;
    const transactionsWithProfit = [];
    const allMonths = Object.keys(monthlyData);
    const chart = [];

    for (const month of allMonths) {
      let monthPurchased = 0;
      let monthSold = 0;

      monthlyData[month].forEach((transaction) => {
        const { type, symbol, quantity, price } = transaction;

        if (type === "BUY") {
          if (!shares[symbol]) shares[symbol] = { quantity: 0, totalCost: 0 };
          shares[symbol].quantity += quantity;
          shares[symbol].totalCost += quantity * price;
          cash -= quantity * price;
          purchased += quantity * price;
          monthPurchased += quantity;
        } else if (type === "SELL") {
          if (!shares[symbol] || shares[symbol].quantity < quantity) {
            transactionsWithProfit.push({
              ...transaction,
              profit: "Error: Insufficient Shares",
            });
          } else {
            const avgCost = shares[symbol].totalCost / shares[symbol].quantity;
            const profit = quantity * (price - avgCost);
            shares[symbol].quantity -= quantity;
            shares[symbol].totalCost -= quantity * avgCost;
            cash += quantity * price;
            sold += quantity * price;
            profitLoss += profit;
            monthSold += quantity;
            transactionsWithProfit.push({ ...transaction, profit });
          }
        }
      });

      remainingInShares = purchased - sold;

      chart.push({
        month,
        purchased: monthPurchased,
        sold: monthSold,
      });

      if (month === selectedMonth) break;
    }

    for (const symbol in shares) {
      if (shares[symbol].quantity === 0) delete shares[symbol];
    }

    setSharesInHand(shares);
    setCashInHand(cash);
    setAmountPurchased(purchased);
    setAmountSold(sold);
    setProfitLoss(profitLoss);
    setTransactions(
      monthlyData[selectedMonth].map((t) => {
        const profitEntry = transactionsWithProfit.find((tp) => tp.date === t.date && tp.symbol === t.symbol);
        return profitEntry ? { ...t, profit: profitEntry.profit } : t;
      })
    );
    setChartData(chart);
    setRemainingInShares(remainingInShares);
  };

  useEffect(() => {
    calculateSummary(selectedMonth);
    localStorage.setItem("selectedMonth", selectedMonth);
  }, [selectedMonth]);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  return (
    <div className="p-6 font-sans bg-gray-100 text-gray-800">
      <h2 className="text-center text-xl font-bold mb-6">Stock Dashboard</h2>

      <div className="mb-4">
        <label className="mr-2">Select Month: </label>
        <select
          value={selectedMonth}
          onChange={handleMonthChange}
          className="p-2 border rounded-md"
        >
          {Object.keys(monthlyData).map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white p-4 rounded-md shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Summary for {selectedMonth}</h3>
        <p><strong>Amount Purchased:</strong> ${amountPurchased.toFixed(2)}</p>
        <p><strong>Amount Sold:</strong> ${amountSold.toFixed(2)}</p>
        <p><strong>Profit/Loss:</strong> ${profitLoss.toFixed(2)}</p>
        <p><strong>Amount Remaining in Shares:</strong> ${remainingInShares.toFixed(2)}</p>
        <p><strong>Shares Remaining:</strong> {Object.entries(sharesInHand).map(([symbol, { quantity }]) => `${symbol}: ${quantity}`).join(", ")}</p>
      </div>

      {/* Table for Transactions (Responsive layout for mobile) */}
      <div className="overflow-x-auto mb-6 sm:max-w-full sm:overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300 sm:table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Symbol</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Quantity</th>
              <th className="p-2 border">Purchase Price</th>
              <th className="p-2 border">Selling Price</th>
              <th className="p-2 border">Total</th>
              <th className="p-2 border">Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="p-2">{t.date}</td>
                <td className="p-2">{t.symbol}</td>
                <td className={`p-2 ${t.type === "BUY" ? "text-green-600" : "text-red-600"}`}>{t.type}</td>
                <td className="p-2">{t.quantity}</td>
                <td className="p-2">{t.type === "BUY" ? `$${t.price.toFixed(2)}` : "-"}</td>
                <td className="p-2">{t.type === "SELL" ? `$${t.price.toFixed(2)}` : "-"}</td>
                <td className="p-2">${(t.quantity * t.price).toFixed(2)}</td>
                <td className={`p-2 ${typeof t.profit === "number" && t.profit > 0 ? "text-green-600" : "text-red-600"}`}>
                  {t.profit && typeof t.profit === "number" ? `$${t.profit.toFixed(2)}` : t.profit || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar Chart (Responsive only on sm) */}
      <div className="flex justify-center mt-6 sm:w-full sm:max-w-xs sm:px-4">
        <BarChart
          width={600}
          height={300}
          data={chartData}
          className="bg-white p-4 rounded-md shadow-md sm:w-full sm:h-64 sm:px-2"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="purchased" fill="#8884d8" />
          <Bar dataKey="sold" fill="#82ca9d" />
        </BarChart>
      </div>
    </div>
  );
};

export default Dashboard;
