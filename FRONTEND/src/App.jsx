import { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import './index.css';

function App() {
  const [preview, setPreview] = useState([]);
  const [columns, setColumns] = useState([]);
  const [question, setQuestion] = useState('');
  const [chartType, setChartType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState([]);
  const [error, setError] = useState(null);
  const [hasSentFirst, setHasSentFirst] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/preview')
      .then(res => res.json())
      .then(data => {
        setPreview(data.preview);
        setColumns(data.columns);
      })
      .catch(console.error);
  }, []);

  const handleGetAnswer = async () => {
    if (!question.trim() || !chartType) return;
    if (!hasSentFirst) setHasSentFirst(true);

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, chartType }),
      });
      const data = await res.json();
      setResult(data.data);
    } catch {
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGetAnswer();
    }
  };

  return (
    <div className="app-wrapper">
      <div className="text-container">
        <h2>Use this as query keywords</h2>
        <ul>
          <li>Project Title (the title of the project)</li>
          <li>Type of Project: Project Type (SETUP, GIA (CEST), etc)</li>
          <li>Year Approved: Year the Project was approved and funded</li>
          <li>Beneficiaries: The Project Beneficiaries</li>
          <li>Collaborators: Project Collaborators</li>
          <li>Sector: Sector of the business (Furniture, Food Processing, etc)</li>
          <li>Province: Province of the project location</li>
          <li>City: City or the Municipality of the project location</li>
          <li>District: Congressional district where the project belongs</li>
          <li>Status: Status of project implementation</li>
          <li>Project Cost: Cost of the project</li>
          <li>Region: Regional office implementing the project</li>
          <li>Implementor: PSTO or office implementing the project</li>
        </ul>
        <h2 className="sample">
          Example prompt: Sum the total project costs from 2016-2020 for Region III, grouped by project type.
        </h2>
      </div>

      <div className={`main-content ${hasSentFirst ? 'first-sent' : ''}`}>
        <header className="flex flex-col items-center mt-8 mb-6">
          <img src="./ULATlogo.png" alt="ULAT AI Logo" className="logo" />
          <p className="text-gray-600 mt-2">Smarter Insights on Science Projects</p>
        </header>

        <main className="content-body">
          {/* Composer */}
          <div className={`composer ${hasSentFirst ? 'composer-bottom' : 'composer-center'}`}>
            <textarea
              ref={inputRef}
              className="composer-textarea"
              placeholder="Ask for DOST Science Projects Budget"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={1}
            />
            <div className="composer-actions">
              <select
                className="select-chart"
                value={chartType}
                onChange={e => setChartType(e.target.value)}
                disabled={loading}
                required
              >
                <option value="" disabled>Select chart…</option>
                <option>Bar Chart</option>
                <option>Pie Chart</option>
              </select>
              <button
                className={`icon-btn send ${
                  loading || !question.trim() || !chartType ? 'disabled' : ''
                }`}
                onClick={handleGetAnswer}
                disabled={loading || !question.trim() || !chartType}
                aria-label="Send"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          {result.length > 0 && (
            <section className="results-section">
              <div className="table-container">
                <h2 className="section-title">Query Result</h2>
                <table className="results-table">
                  <thead>
                    <tr>
                      {Object.keys(result[0]).map(col => <th key={col}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((row, i) => (
                      <tr key={i} className={i % 2 ? 'row-alt' : ''}>
                        {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="visualization">
                <h2 className="section-title">Visualization</h2>
                <Plot
                  data={[{
                    x: result.map(r => r[Object.keys(r)[0]]),
                    y: result.map(r => r[Object.keys(r)[1]]),
                    type: chartType.toLowerCase().includes('bar') ? 'bar'
                      : chartType.toLowerCase().includes('pie') ? 'pie'
                      : 'scatter',
                    mode: chartType === 'Line Chart' ? 'lines' : undefined,
                    fill: chartType === 'Area Chart' ? 'tozeroy' : undefined,
                  }]}
                  layout={{
                    title: `${Object.keys(result[0])[1]} by ${Object.keys(result[0])[0]}`,
                    autosize: true,
                    height: 400
                  }}
                  useResizeHandler
                  className="plotly-chart"
                />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
