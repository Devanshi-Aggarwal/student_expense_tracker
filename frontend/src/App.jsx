import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

function App() {
  // 🔽 ONLY NEW STATES ADDED HERE
  const [isSignup, setIsSignup] = useState(false);
  const [auth, setAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reportMonth, setReportMonth] = useState("");
  const [reportType, setReportType] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState("All");

  const [view, setView] = useState("home");

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // ✅ NEW: loading state
  const [loading, setLoading] = useState(false);

  // ✏️ EDIT START
  const startEdit = (exp) => {
    setEditId(exp._id);
    setTitle(exp.title);
    setAmount(exp.amount);
    setCategory(exp.category);
    setDate(exp.date);
  };

  // 🌙 THEME
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (!savedTheme) {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(systemDark);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // 🔽 ADD AUTO LOGIN HERE
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuth(true);
    }
  }, []);

  // 📡 FETCH
  const fetchExpenses = async () => {
    try {
    const token = localStorage.getItem("token");

    const res = await axios.get("https://student-expense-tracker-2-tgl7.onrender.com/expenses", {
      headers: {
        Authorization: token,
      },
    });

    setExpenses(res.data);
   } catch (err) {
    console.error("Fetch error:", err);
   }
  };

  useEffect(() => {
    if (auth) {
      fetchExpenses();
    }
  }, [auth]);

  // ➕ ADD / ✏️ UPDATE
  const addExpense = async () => {
    if (!title || !amount || !date) {
      alert("Fill all fields");
      return;
    }

    const payload = {
      title,
      amount: Number(amount),
      category,
      date,
    };

    try {
      setLoading(true); // ✅ start loading

      const token = localStorage.getItem("token");

      if (editId) {
        await axios.put(`https://student-expense-tracker-2-tgl7.onrender.com/${editId}`, payload, {
          headers: { Authorization: token },
        });
       setEditId(null);
      } else {
        await axios.post("https://student-expense-tracker-2-tgl7.onrender.com/add", payload, {
          headers: { Authorization: token },
        });
      }

      alert("✅ Expense added!");

      setTitle("");
      setAmount("");
      setDate("");

      fetchExpenses();
    } catch (err) {
      console.error("❌ ERROR:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false); // ✅ stop loading
    }
  };

  // ❌ DELETE
  const deleteExpense = async (id) => {
    const token = localStorage.getItem("token");

    await axios.delete(`https://student-expense-tracker-2-tgl7.onrender.com/delete/${id}`, {
      headers: { Authorization: token },
    });

    fetchExpenses();
  };

  const login = async () => {
  try {
    const res = await axios.post("https://student-expense-tracker-2-tgl7.onrender.com/login", {
      email,
      password,
    });

    localStorage.setItem("token", res.data.token);
    setAuth(true);
  } catch (err) {
    alert(err.response?.data?.error || "Login failed");
  }
};

// 🔽 ADD SIGNUP FUNCTION HERE
const signup = async () => {
  try {
    await axios.post("https://student-expense-tracker-2-tgl7.onrender.com/signup", {
      email,
      password,
    });

    alert("Signup successful! Now login.");
    setIsSignup(false);
  } catch (err) {
    alert(err.response?.data?.error || "Signup failed");
  }
};


  // 📊 CALCULATIONS
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const filteredExpenses =
    filter === "All"
      ? expenses
      : expenses.filter((e) => e.category === filter);

  const categoryData = Object.values(
    expenses.reduce((acc, e) => {
      if (!acc[e.category]) acc[e.category] = { name: e.category, value: 0 };
      acc[e.category].value += Number(e.amount);
      return acc;
    }, {})
  );

  const monthlyData = Object.values(
    expenses.reduce((acc, e) => {
      if (!e.date) return acc;
      const d = new Date(e.date);
      const key = d.getMonth();

      if (!acc[key]) {
        acc[key] = {
          month: d.toLocaleString("default", { month: "short" }),
          total: 0,
          order: key,
        };
      }

      acc[key].total += Number(e.amount);
      return acc;
    }, {})
  ).sort((a, b) => a.order - b.order);

  // 🔽 ONLY NEW CALCULATION ADDED HERE
  const dailyTotal = reportDate
    ? expenses
      .filter((e) => e.date === reportDate)
      .reduce((sum, e) => sum + Number(e.amount), 0)
    : 0;

  const monthlyTotal = reportMonth
    ? expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d.getMonth() === Number(reportMonth);
        })
        .reduce((sum, e) => sum + Number(e.amount), 0)
    : 0;

  // 🔽 NEW: daily expenses list
  const dailyExpenses = reportDate
    ? expenses.filter((e) => e.date === reportDate)
    : [];

  // 🔽 NEW: monthly expenses list
  const monthlyExpenses = reportMonth !== ""
    ? expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === Number(reportMonth);
      })
    : [];

  // 🔽 NEW: monthly insights
  const monthlyCategoryData = Object.values(
    monthlyExpenses.reduce((acc, e) => {
      if (!acc[e.category]) acc[e.category] = { name: e.category, value: 0 };
      acc[e.category].value += Number(e.amount);
      return acc;
    }, {})
  );

  const topCategory =
    monthlyCategoryData.length > 0
      ? monthlyCategoryData.reduce((a, b) => (a.value > b.value ? a : b))
      : null;

  const highestExpense =
    monthlyExpenses.length > 0
      ? monthlyExpenses.reduce((a, b) => (a.amount > b.amount ? a : b))
      : null;

  const highestCategory =
    categoryData.length > 0
      ? categoryData.reduce((a, b) => (a.value > b.value ? a : b))
      : null;

  const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];

  // 🔽 ADD THIS FUNCTION HERE
  const exportPDF = async () => {
    const input = document.getElementById("report-content");

    if (!input) {
      alert("No report content found");
      return;
    }

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save("Expense_Report.pdf");
  };

if (!auth) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-4">

      <h2 className="text-2xl font-bold">
        {isSignup ? "Signup 📝" : "Login 🔐"}
      </h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="p-3 rounded-lg border w-64"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="p-3 rounded-lg border w-64"
      />

      <button
        onClick={isSignup ? signup : login}
        className="px-5 py-2 bg-blue-500 text-white rounded-lg"
      >
        {isSignup ? "Signup" : "Login"}
      </button>

      {/* 🔄 TOGGLE */}
      <p
        onClick={() => setIsSignup(!isSignup)}
        className="text-blue-500 cursor-pointer"
      >
        {isSignup
          ? "Already have an account? Login"
          : "New user? Signup"}
      </p>

    </div>
  );
}

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black text-black dark:text-white p-4 md:p-8 transition-all duration-300">

        {view === "home" ? (
          <>
            {/* HEADER */}
            <div className="sticky top-0 z-50 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md mb-8">
              <div className="flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto px-4 py-4">

            {/* TITLE */}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Student Expense Tracker 
           </h1>

            {/* BUTTONS */}
            <div className="flex gap-3 mt-4 md:mt-0">

              <button
                onClick={() => setView("reports")}
                className="px-5 py-2 rounded-lg bg-green-500 text-white shadow-md hover:bg-green-600 hover:scale-105 transition duration-300"
              >
                Reports 
              </button>

               <button
                onClick={() => setDarkMode(!darkMode)}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md hover:scale-105 transition duration-300"
              >
                {darkMode ? "☀️ Light" : "🌙 Dark"}
              </button>

              <button
              onClick={() => {
                localStorage.removeItem("token");
                setAuth(false);
                setExpenses([]);
                setView("home");
              }}
              className="px-5 py-2 rounded-lg bg-red-500 text-white shadow-md hover:bg-red-600 hover:scale-105 transition duration-300"
              >
                Logout 
              </button>

            </div>
       </div>
    </div>

            {/* SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/60 dark:bg-gray-800/60 p-5 rounded-2xl shadow-lg hover:scale-105 transition duration-300">
                <p>Total Spent</p>
                <p className="text-3xl font-bold text-green-500">₹{total}</p>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 p-5 rounded-2xl shadow-lg hover:scale-105 transition duration-300">
                <p>Top Category</p>
                <p className="text-3xl font-bold text-purple-500">
                  {highestCategory ? highestCategory.name : "N/A"}
                </p>
              </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/60 dark:bg-gray-800/60 p-5 rounded-2xl flex justify-center shadow-lg hover:scale-105 transition duration-300">
                <PieChart width={320} height={260}>
                  <Pie data={categoryData} dataKey="value">
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 p-5 rounded-2xl flex justify-center shadow-lg hover:scale-105 transition duration-300">
                <LineChart width={320} height={260} data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" />
                </LineChart>
              </div>
            </div>

            {/* FORM */}
            <div className="bg-white/60 dark:bg-gray-800/60 p-6 rounded-2xl max-w-md mx-auto mb-8 space-y-4 shadow-lg hover:scale-105 transition duration-300">
              
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full p-3 rounded-xl bg-white text-black dark:bg-gray-700 dark:text-white"
              />

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="w-full p-3 rounded-xl bg-white text-black dark:bg-gray-700 dark:text-white"
              />

              {/* ✅ NEW CATEGORY DROPDOWN */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 rounded-xl bg-white text-black dark:bg-gray-700 dark:text-white"
              >
                <option>Food</option>
                <option>Water</option>
                <option>Courses</option>
                <option>Travel</option>
              </select>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-xl bg-white text-black dark:bg-gray-700 dark:text-white"
              />

              <button
                onClick={addExpense}
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 rounded-2xl hover:scale-105 transition duration-300"
              >
                {loading
                  ? "Adding..."
                  : editId
                  ? "Update Expense ✏️"
                  : "Add Expense"}
              </button>
            </div>

            {/* LIST */}
            <div className="max-w-2xl mx-auto space-y-4">
              
              {/* ✅ EMPTY STATE */}
              {filteredExpenses.length === 0 && (
                <p className="text-center">No expenses yet</p>
              )}

              {filteredExpenses.map((exp) => (
                <div
                  key={exp._id}
                  className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-2xl flex justify-between shadow-lg hover:scale-105 transition duration-300"
                >
                  <div>
                    <p>{exp.title}</p>
                    <p>{exp.category} | {exp.date}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => startEdit(exp)}
                      className="text-blue-500 hover:scale-110 transition"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => deleteExpense(exp._id)}
                      className="text-red-500 hover:scale-110 transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* REPORTS */}
            <div id="report-content">
              
            <div className="text-center mt-20">
              <div className="flex items-center justify-between mb-6">

                {/* 🔽 LEFT: Back Button */}
                <button
                  onClick={() => setView("home")}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                 ← Back
                </button>

                {/* 🔽 CENTER: Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-center flex-1 tracking-tight">
                  📊 Reports
                </h2>

                {/* 🔽 RIGHT: Empty space for balance */}
                <button
                  onClick={exportPDF}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:scale-105 transition"
                >
                  Export PDF 📄
               </button>

              </div>

              <div className="flex flex-col md:flex-row gap-6 justify-center">
                <button
                  onClick={() => setReportType("daily")}
                  className="px-6 py-4 bg-blue-500 text-white rounded-2xl shadow-lg hover:scale-105 transition duration-300"
                >
                Daily Report 📅
                </button>

                <button 
                  onClick={() => setReportType("monthly")}
                  className="px-6 py-4 bg-purple-500 text-white rounded-2xl shadow-lg hover:scale-105 transition duration-300"
                >
                Monthly Report 📆
                </button>
              </div>

              {/* 🔽 ADD THIS RIGHT HERE */}
              {reportType === "daily" && (
                <div className="mt-8 space-y-4">
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="p-3 rounded-xl bg-white text-black dark:bg-gray-700 dark:text-white"
                  />

                  {reportDate && (
                    <p className="text-xl font-bold">
                      Total Expense: ₹{dailyTotal}
                    </p>
                  )}

                  {dailyExpenses.length > 0 && (
                   <div className="mt-4 space-y-2">
                      {dailyExpenses.map((exp) => (
                        <div
                          key={exp._id}
                          className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-xl flex justify-between"
                        >
                          <span>{exp.title}</span>
                          <span>₹{exp.amount}</span>
                        </div>
                      ))}
                   </div>
                  )}

                </div>
              )}

              {/* ✅ ADD MONTHLY UI HERE (JUST BELOW DAILY) */}
              {reportType === "monthly" && (
                <div className="mt-8 space-y-4">
                  <select
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="p-3 rounded-xl bg-white text-black dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Month</option>
                    <option value="0">January</option>
                    <option value="1">February</option>
                    <option value="2">March</option>
                    <option value="3">April</option>
                    <option value="4">May</option>
                    <option value="5">June</option>
                    <option value="6">July</option>
                    <option value="7">August</option>
                    <option value="8">September</option>
                    <option value="9">October</option>
                    <option value="10">November</option>
                    <option value="11">December</option>
                </select>

                {reportMonth !== "" && (
                 <p className="text-xl font-bold">
                   Total Expense: ₹{monthlyTotal}
                 </p>
                )}

                {/* 🔽 MONTHLY INSIGHTS */}
                {reportMonth !== "" && monthlyExpenses.length > 0 && (
                  <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-xl mt-4 space-y-2">
                    <p>Transactions: {monthlyExpenses.length}</p>
                    <p>Top Category: {topCategory?.name}</p>
                    <p>Highest Expense: ₹{highestExpense?.amount}</p>
                  </div>
                )}

                {/* 🔽 MONTHLY PIE CHART */}
                {monthlyCategoryData.length > 0 && (
                  <div className="flex justify-center mt-4">
                    <PieChart width={300} height={250}>
                      <Pie data={monthlyCategoryData} dataKey="value">
                        {monthlyCategoryData.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                 </div>
                )}

                {monthlyExpenses.length > 0 && (
                 <div className="mt-4 space-y-2">
                   {monthlyExpenses.map((exp) => (
                    <div
                      key={exp._id}
                      className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-xl flex justify-between"
                    >
                      <span>{exp.title}</span>
                      <span>₹{exp.amount}</span>
                    </div>
                  ))}
                </div>
                )}

             </div>
          )}

            </div>

          </div>  

          </>
        )}
      </div>
    </div>
  );
}

export default App;
