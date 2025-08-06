import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [preview, setPreview] = useState([]);
  const [columns, setColumns] = useState([]);
  const [question, setQuestion] = useState('');
  const [chartType, setChartType] = useState('Bar Chart');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [result, setResult] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/preview')
      .then(res => res.json())
      .then(data => {
        setPreview(data.preview);
        setColumns(data.columns);
      })
      .catch(err => console.error(err));
  }, []);

  const handleGetAnswer = async () => {
    if (!question) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, chartType }),
      });
      const data = await res.json();
      setCode(data.code);
      setResult(data.data);
    } catch (err) {
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden p-4 absolute top-0 left-0"
      >
        {sidebarOpen 
          ? <XMarkIcon className="w-6 h-6" /> 
          : <Bars3Icon className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-64 bg-white border-r p-4 overflow-auto`}
      >
        <h2 className="text-lg font-semibold mb-2">Data Preview</h2>
        <div className="overflow-auto mb-4">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                {columns.slice(0, 5).map(col => (
                  <th key={col} className="px-2 py-1 text-left">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 5).map((row, i) => (
                <tr key={i} className={i % 2 ? 'bg-gray-100' : 'bg-white'}>
                  {columns.slice(0, 5).map(col => (
                    <td key={col} className="px-2 py-1">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 className="text-lg font-semibold mb-2">Columns</h2>
        <ul className="list-disc ml-5">
          {columns.map(col => (
            <li key={col}>{col}</li>
          ))}
        </ul>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-3xl font-bold mb-2">🤖 CSV Query Assistant</h1>
        <p className="mb-6 text-gray-700">
          Ask a question in plain English about your data and the AI will generate the answer.
        </p>

        <div className="mb-4">
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="e.g., Show me the total project costs by sector."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <select
            className="border rounded p-2"
            value={chartType}
            onChange={e => setChartType(e.target.value)}
            disabled={loading}
          >
            {['Bar Chart', 'Pie Chart', 'Line Chart', 'Area Chart', 'Table Only'].map(
              type => (
                <option key={type} value={type}>
                  {type}
                </option>
              )
            )}
          </select>
        </div>
        <button
          onClick={handleGetAnswer}
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading || !question}
        >
          {loading ? 'Loading...' : 'Get Answer'}
        </button>
        {error && <p className="mt-4 text-red-500">{error}</p>}

        {code && (
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Generated Pandas Query</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              <code>{code}</code>
            </pre>
          </section>
        )}

        {result.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Query Result</h2>
            {/* Table */}
            <div className="overflow-auto mb-4">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-200">
                  <tr>
                    {Object.keys(result[0]).map(col => (
                      <th key={col} className="px-2 py-1 text-left">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.map((row, i) => (
                    <tr key={i} className={i % 2 ? 'bg-gray-100' : 'bg-white'}>
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-2 py-1">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Chart */}
            {chartType !== 'Table Only' && (
              <div className="mt-4">
                <Plot
                  data={[{
                    x: result.map(r => r[Object.keys(r)[0]]),
                    y: result.map(r => r[Object.keys(r)[1]]),
                    type:
                      chartType === 'Bar Chart'
                        ? 'bar'
                        : chartType === 'Pie Chart'
                        ? 'pie'
                        : 'scatter',
                    mode: chartType === 'Line Chart' ? 'lines' : undefined,
                    fill: chartType === 'Area Chart' ? 'tozeroy' : undefined,
                  }]}
                  layout={{
                    title: `${Object.keys(result[0])[1]} by ${Object.keys(result[0])[0]}`,
                    autosize: true,
                    height: 400,
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;