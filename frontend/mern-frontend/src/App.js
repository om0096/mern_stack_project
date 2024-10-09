import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Label} from 'recharts';

function App() {
  // State variables to hold data, input values, and chart information
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [statistics, setStatistics] = useState({ totalSales: 0, soldItems: 0, unsoldItems: 0 });
  const [month, setMonth] = useState('March');
  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);

  // Function to fetch transaction data based on page, search term, and selected month
  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/transactions', {
        params: { page, perPage, search: searchTerm, month }
      });
      const data = response.data;

      setTransactions(data); 

      if (data.length === 0) {
        setStatistics({ totalSales: 0, soldItems: 0, unsoldItems: 0 });
        setBarChartData([]);
        setPieChartData([]);
      } else {
        fetchStatistics();
        fetchBarChartData();
        fetchPieChartData();
      }
    } catch (error) {
      console.error("Error fetching transactions: ", error);
    }
  };


  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/statistics', {
        params: { month, search: searchTerm }
      });
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics: ", error);
    }
  };

  //Fetch Barchart
  const fetchBarChartData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/barchart', {
        params: { month, search: searchTerm }
      });
      setBarChartData(response.data);
    } catch (error) {
      console.error("Error fetching bar chart data: ", error);
    }
  };

  // Fetch Piechart
  const fetchPieChartData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/piechart', {
        params: { month, search: searchTerm  }
      });
      setPieChartData(response.data);
    } catch (error) {
      console.error("Error fetching pie chart data: ", error);
    }
  };

  // Handle search and transactions
  useEffect(() => {
    fetchTransactions();
  }, [page, searchTerm, month]);

  // Handle Enter key press for search
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      setPage(1);
      fetchTransactions();
    }
  };

  // Prepare data for Recharts Pie Chart
  const pieData = Object.entries(pieChartData).map(([key, value]) => ({
    name: key,
    value: value,
  }));

  //UI 
  return (
    <div className="App">
    <h1>Transaction Dashboard</h1>

    <div className="selector-search-container">
      <div className="selector">
        <label>Select Month: </label>
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>

      <div className="search-box">
        <label htmlFor="searchInput" style={{ marginBottom: '0px', fontWeight: 'bold' }}>Search:</label>
        <input
          id="searchInput"
          type="text"
          placeholder="Search transactions by title, description, or price..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>

      <h2 style={{ textAlign: 'center' }}>Transactions</h2>
      <table className="styled-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
            <th>Category</th>
            <th>Sold</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction._id}>
              <td>{transaction._id}</td>
              <td>{transaction.title}</td>
              <td>{transaction.description}</td>
              <td>${transaction.price}</td>
              <td>{transaction.category}</td>
              <td>{transaction.sold ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => setPage(page > 1 ? page - 1 : 1)}>Previous</button>
        <button onClick={() => setPage(page + 1)}>Next</button>
      </div>

      <div className="statistics-container">
        <h2>Statistics for {month}</h2>
        <div className="statistics">
          <p>Total Sales: <span>${statistics.totalSales}</span></p>
          <p>Sold Items: <span>{statistics.soldItems}</span></p>
          <p>Unsold Items: <span>{statistics.unsoldItems}</span></p>
        </div>
      </div>

      <div className="chart-container">
        <h2 style={{ textAlign: 'center' }}>Bar Chart</h2>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={Object.entries(barChartData).map(([key, value]) => ({ name: key, value }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name">
              <Label value="Prices" offset={-10} position="bottom" style={{ textAnchor: 'middle', fontWeight: 'bold' }} />
            </XAxis>
            <YAxis>
              <Label value="Items" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontWeight: 'bold' }} />
            </YAxis>
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h2 style={{ textAlign: 'center' }}>Pie Chart</h2>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={150}
              fill="#8884d8"
              label={(entry) => `${entry.name}: ${entry.value}`}
              labelLine={false}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <footer>
        <p>&copy; Developed By Om Jadhav </p>
      </footer>
    </div>
  );
}

export default App;
