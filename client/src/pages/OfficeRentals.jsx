import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const OfficeRentals = () => {
    const [consultorios, setConsultorios] = useState([]);
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Form state for new rental
    const [selectedOffice, setSelectedOffice] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const cRes = await api.get('/consultorios');
                setConsultorios(cRes.data);

                if (user.role === 'doctor') {
                    const rRes = await api.get('/consultorios/my-rentals');
                    setRentals(rRes.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.role]);

    const handleRent = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await api.post('/consultorios/rent', {
                consultorio_id: selectedOffice,
                rental_date: date,
                start_time: startTime,
                end_time: endTime,
                cost: 50.00 // Fixed cost for demo
            });
            setMessage('Rental booked successfully!');
            // Refresh rentals
            const rRes = await api.get('/consultorios/my-rentals');
            setRentals(rRes.data);
        } catch (err) {
            setMessage('Failed to book rental.');
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>MediCare</h2>
                </div>
                <nav>
                    <a href="/dashboard" className="sidebar-link">Dashboard</a>
                    <a href="/appointments" className="sidebar-link">Appointments</a>
                    <a href="#" className="sidebar-link active">Office Rentals</a>
                </nav>
            </aside>
            <main className="main-content">
                <h1 className="title">Office Rentals</h1>

                {message && <div style={{ padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Booking Form (Doctors only) */}
                    {user.role === 'doctor' && (
                        <div className="card">
                            <h3>Book an Office</h3>
                            <form onSubmit={handleRent}>
                                <div className="input-group">
                                    <label className="input-label">Select Office</label>
                                    <select className="input-field" value={selectedOffice} onChange={(e) => setSelectedOffice(e.target.value)} required>
                                        <option value="">-- Select --</option>
                                        {consultorios.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} - {c.status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Date</label>
                                    <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label className="input-label">Start Time</label>
                                        <input type="time" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">End Time</label>
                                        <input type="time" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Book Rental ($50.00)</button>
                            </form>
                        </div>
                    )}

                    {/* Available Offices List */}
                    <div className="card">
                        <h3>Available Offices</h3>
                        {consultorios.map(c => (
                            <div key={c.id} style={{ padding: '1rem', background: '#f8fafc', marginBottom: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <strong>{c.name}</strong>
                                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#64748b' }}>{c.description || 'No description'}</p>
                                <span style={{ fontSize: '0.8rem', padding: '2px 6px', background: c.status === 'available' ? '#dcfce7' : '#fee2e2', color: c.status === 'available' ? '#166534' : '#991b1b', borderRadius: '4px' }}>
                                    {c.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* My Rentals List */}
                {user.role === 'doctor' && rentals.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h2 className="title" style={{ fontSize: '1.5rem' }}>My Rentals</h2>
                        <div className="card">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '1rem' }}>Office</th>
                                        <th style={{ padding: '1rem' }}>Date</th>
                                        <th style={{ padding: '1rem' }}>Time</th>
                                        <th style={{ padding: '1rem' }}>Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rentals.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem' }}>{r.consultorio_name}</td>
                                            <td style={{ padding: '1rem' }}>{new Date(r.rental_date).toLocaleDateString()}</td>
                                            <td style={{ padding: '1rem' }}>{r.start_time} - {r.end_time}</td>
                                            <td style={{ padding: '1rem' }}>${r.cost}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OfficeRentals;
