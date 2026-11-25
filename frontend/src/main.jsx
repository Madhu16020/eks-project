import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = '/api/employees';

function App() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    department: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadEmployees() {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(API);
      if (!response.ok) throw new Error('Unable to load employees');
      setEmployees(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  function updateForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function saveEmployee(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch(
        editingId ? `${API}/${editingId}` : API,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Unable to save employee');
      }

      setForm({ name: '', email: '', department: '' });
      setEditingId(null);
      await loadEmployees();
    } catch (err) {
      setError(err.message);
    }
  }

  function editEmployee(employee) {
    setForm({
      name: employee.name,
      email: employee.email,
      department: employee.department
    });
    setEditingId(employee.id);
  }

  async function deleteEmployee(id) {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      const response = await fetch(`${API}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Unable to delete employee');
      await loadEmployees();
    } catch (err) {
      setError(err.message);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: '', email: '', department: '' });
  }

  return (
    <div className="app">
      <header>
        <div>
          <h1>CloudOps Employee Management</h1>
          <p>AWS EKS | React | Node.js | PostgreSQL</p>
        </div>
        <span className="status">Application Dashboard</span>
      </header>

      <main>
        <section className="summary">
          <div className="summary-card">
            <span>Total Employees</span>
            <strong>{employees.length}</strong>
          </div>
          <div className="summary-card">
            <span>Application</span>
            <strong className="healthy">Running</strong>
          </div>
          <div className="summary-card">
            <span>Database</span>
            <strong className="healthy">Connected</strong>
          </div>
        </section>

        <section className="panel">
          <h2>{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>

          <form onSubmit={saveEmployee}>
            <input
              name="name"
              placeholder="Employee Name"
              value={form.name}
              onChange={updateForm}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={updateForm}
              required
            />
            <input
              name="department"
              placeholder="Department"
              value={form.department}
              onChange={updateForm}
              required
            />
            <button type="submit">
              {editingId ? 'Update Employee' : 'Add Employee'}
            </button>
            {editingId && (
              <button type="button" className="cancel" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </form>
          {error && <p className="error">{error}</p>}
        </section>

        <section className="panel">
          <div className="table-heading">
            <h2>Employee Directory</h2>
            <button className="refresh" onClick={loadEmployees}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading employees...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(employee => (
                    <tr key={employee.id}>
                      <td>{employee.id}</td>
                      <td>{employee.name}</td>
                      <td>{employee.email}</td>
                      <td>{employee.department}</td>
                      <td>
                        <button
                          className="edit"
                          onClick={() => editEmployee(employee)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete"
                          onClick={() => deleteEmployee(employee.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan="5">No employees found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer>CloudOps 3-Tier Application | Running on AWS EKS</footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
