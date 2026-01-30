import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/organisms/Sidebar';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Calendar from '../components/organisms/Calendar';
import '../styles/pages/MonthlyView.css';

const MonthlyView = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [monthsData, setMonthsData] = useState({});
    const [loading, setLoading] = useState(true);

    const handleDateSelect = (date) => {
        // Redirigir a la agenda con el día seleccionado y el médico actual
        navigate('/appointments', {
            state: {
                selectedDate: date,
                viewDoctorId: selectedDoctorId
            }
        });
    };

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await api.get('/users/doctors');
                setDoctors(res.data);
                if (res.data.length > 0) {
                    const lastDocId = localStorage.getItem('last_selected_doctor_id');
                    const initialDoc = lastDocId || res.data[0].id;
                    setSelectedDoctorId(initialDoc);
                }
            } catch (err) {
                console.error("Error fetching doctors", err);
            }
        };
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (!selectedDoctorId) return;

        const fetchYearStats = async () => {
            setLoading(true);
            try {
                // We fetch all months of the selected year
                const promises = Array.from({ length: 12 }, (_, i) =>
                    api.get(`/appointments/stats?year=${year}&month=${i + 1}&doctor_id=${selectedDoctorId}`)
                );
                const results = await Promise.all(promises);
                const yearData = {};
                results.forEach((res, i) => {
                    yearData[i + 1] = res.data;
                });
                setMonthsData(yearData);
            } catch (err) {
                console.error("Error fetching year stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchYearStats();
    }, [selectedDoctorId, year]);

    const handleDoctorChange = (e) => {
        setSelectedDoctorId(e.target.value);
        localStorage.setItem('last_selected_doctor_id', e.target.value);
    };

    return (
        <div className="monthly-view-layout">
            <Sidebar />
            <main className="monthly-view-content">
                <header className="monthly-view-header">
                    <div className="header-info">
                        <h1 className="header-title">🗓️ Vista Anual de Disponibilidad</h1>
                        <p className="header-subtitle">Resumen mensual de turnos ocupados y libres.</p>
                    </div>

                    <div className="header-filters">
                        <div className="filter-item">
                            <label>Médico:</label>
                            <select value={selectedDoctorId} onChange={handleDoctorChange}>
                                {doctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>Año:</label>
                            <div className="flex items-center gap-2">
                                <button className="nav-btn" onClick={() => setYear(y => y - 1)}>⬅️</button>
                                <span className="year-display">{year}</span>
                                <button className="nav-btn" onClick={() => setYear(y => y + 1)}>➡️</button>
                            </div>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Cargando disponibilidad anual...</p>
                    </div>
                ) : (
                    <div className="months-grid">
                        {Array.from({ length: 12 }, (_, i) => {
                            const monthDate = new Date(year, i, 1);
                            return (
                                <div key={i} className="month-card">
                                    <div className="month-calendar-wrapper">
                                        <Calendar
                                            selectedDate={monthDate}
                                            onDateSelect={handleDateSelect}
                                            calendarStats={monthsData[i + 1] || {}}
                                            appointments={[]} // We rely on stats for indicators
                                            holidays={[]}
                                            hideNavigation={true}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MonthlyView;
