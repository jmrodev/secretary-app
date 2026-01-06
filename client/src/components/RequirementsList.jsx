import { useState, useEffect } from 'react';
import api from '../api/axios';

const RequirementsList = ({ user }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/medical/requests');
            // Filter for "active" or "in progress" if needed, 
            // but 'pending' is usually what "que estan realizandose" means.
            // The backend returns all, let's filter specifically for pending/in-process.
            const active = res.data.filter(r => r.status === 'pending');
            setRequests(active);
        } catch (err) {
            console.error("Failed to fetch requirements", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    const typeLabels = {
        'prescription': 'Receta 💊',
        'license': 'Licencia 📄',
        'referral': 'Derivación 📋'
    };

    if (loading) return <div>Cargando requerimientos...</div>;

    if (requests.length === 0) {
        return <div className="text-muted" style={{ padding: '1rem', fontStyle: 'italic' }}>No hay requerimientos pendientes.</div>;
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#64748b' }}>
                        <th style={{ padding: '0.5rem' }}>Tipo</th>
                        <th style={{ padding: '0.5rem' }}>Paciente</th>
                        <th style={{ padding: '0.5rem' }}>Doctor</th>
                        <th style={{ padding: '0.5rem' }}>Solicitado Por</th>
                        <th style={{ padding: '0.5rem' }}>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '0.5rem' }}>
                                <span style={{
                                    background: r.type === 'prescription' ? '#eff6ff' : '#f0fdf4',
                                    color: r.type === 'prescription' ? '#1d4ed8' : '#15803d',
                                    padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500
                                }}>
                                    {typeLabels[r.type] || r.type}
                                </span>
                            </td>
                            <td style={{ padding: '0.5rem', fontWeight: 500 }}>{r.patient_name}</td>
                            <td style={{ padding: '0.5rem' }}>{r.doctor_name}</td>
                            <td style={{ padding: '0.5rem' }}>{r.secretary_name || 'Secretaría'}</td>
                            <td style={{ padding: '0.5rem' }}>
                                <span style={{ color: '#ca8a04', background: '#fef9c3', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                    {r.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RequirementsList;
