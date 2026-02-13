import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import MainLayout from '../components/templates/MainLayout';
import Loading from '../components/atoms/Loading';
import Button from '../components/atoms/Button';
import { formatPrice } from '../utils/format';
import { formatDate } from '../utils/dateUtils';

const OfficeRentals = () => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const [consultorios, setConsultorios] = useState([]);
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Form state for new rental
    const [selectedOffice, setSelectedOffice] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

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
        try {
            await api.post('/consultorios/rent', {
                consultorio_id: selectedOffice,
                rental_date: date,
                start_time: startTime,
                end_time: endTime,
                cost: 50.00 // Fixed cost for demo
            });
            setRentals(rRes.data);
            showMessage(t('rental_booked'), 'success');
        } catch (err) {
            console.error(err);
            showMessage(t('failed_book_rental'), 'error');
        }
    };

    return (
        <MainLayout>
            <h1 className="title">{t('office_rentals')}</h1>

            {loading ? (
                <Loading variant="centered" text={t('loading_rentals')} />
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Booking Form (Doctors only) */}
                        {user.role === 'doctor' && (
                            <div className="card">
                                <header className="card-header border-b-0 mb-4">
                                    <h3 className="card-header__title">{t('book_office')}</h3>
                                </header>
                                <form onSubmit={handleRent} className="flex flex-col gap-4">
                                    <div className="input-group">
                                        <label className="input-label">{t('select_office')}</label>
                                        <select className="input-field" value={selectedOffice} onChange={(e) => setSelectedOffice(e.target.value)} required>
                                            <option value="">-- {t('select_office')} --</option>
                                            {consultorios.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} - {t(c.status) || c.status}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('date')}</label>
                                        <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} required />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="input-group">
                                            <label className="input-label">{t('start_time')}</label>
                                            <input type="time" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('end_time')}</label>
                                            <input type="time" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full">{t('book_rental_btn')}</Button>
                                </form>
                            </div>
                        )}

                        {/* Available Offices List */}
                        <div className="card">
                            <header className="card-header border-b-0 mb-4">
                                <h3 className="card-header__title">{t('available_offices')}</h3>
                            </header>
                            <div className="flex flex-col gap-2">
                                {consultorios.map(c => (
                                    <div key={c.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <strong className="text-main-800">{c.name}</strong>
                                        <p className="text-sm text-slate-500 my-1">{c.description || 'No description'}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {t(c.status) || c.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* My Rentals List */}
                    {user.role === 'doctor' && rentals.length > 0 && (
                        <div className="mt-8">
                            <h2 className="title mb-4">{t('my_rentals')}</h2>
                            <div className="card p-0 overflow-hidden">
                                <div className="table-responsive">
                                    <table className="table-base w-full">
                                        <thead>
                                            <tr>
                                                <th className="pl-6">{t('office')}</th>
                                                <th>{t('date')}</th>
                                                <th>{t('time')}</th>
                                                <th className="pr-6 text-right">{t('cost')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rentals.map(r => (
                                                <tr key={r.id}>
                                                    <td className="pl-6 font-bold text-main-800">{r.consultorio_name}</td>
                                                    <td>{formatDate(r.rental_date)}</td>
                                                    <td>{r.start_time} - {r.end_time}</td>
                                                    <td className="pr-6 text-right font-mono text-green-600">{formatPrice(r.cost)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </MainLayout>
    );
};

export default OfficeRentals;
