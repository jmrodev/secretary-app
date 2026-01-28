import React from 'react';
import { usePublicPrescriptionRequestController } from '../controllers/usePublicPrescriptionRequestController';
import StatusDisplay from '../components/molecules/StatusDisplay';
import Button from '../components/atoms/Button';

const PublicPrescriptionRequest = () => {
    const {
        loading,
        error,
        success,
        patientInfo,
        selectedMeds,
        notes,
        setNotes,
        searchTerm,
        setSearchTerm,
        searchResults,
        searching,
        handleToggleMedSelection,
        handleAddManualMed,
        handleSubmit
    } = usePublicPrescriptionRequestController();

    if (loading && !patientInfo) return <StatusDisplay type="loading" message="Cargando..." />;
    // Only show full page error if we don't even have patient info (initial load failure)
    if (error && !patientInfo) return <StatusDisplay type="error" title="Error" message={error} />;
    if (success) return <StatusDisplay type="success" title="¡Solicitud Enviada!" message="Tu médico recibirá la solicitud. Te notificaremos cuando las recetas estén listas." />;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
            <div className="max-w-xl w-full flex flex-col gap-6">
                <header className="text-center mb-4">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">💊</div>
                    <h1 className="text-2xl font-black text-slate-800">Solicitud de Recetas</h1>
                    <p className="text-slate-500 font-medium">Paciente: <span className="text-blue-600">{patientInfo?.patientName}</span></p>
                </header>

                {/* Error Banner for submission issues */}
                {error && patientInfo && (
                    <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
                        <p className="text-red-600 font-bold text-sm flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </p>
                    </div>
                )}

                {/* Recent Medications Section */}
                {patientInfo?.recentMeds?.length > 0 && (
                    <section className="card p-6 shadow-sm border-none">
                        <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">📜 Medicación Reciente</h2>
                        <div className="flex flex-wrap gap-2">
                            {patientInfo.recentMeds.map((med, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleToggleMedSelection(med)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 text-left truncate max-w-full
                                        ${selectedMeds.includes(med)
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105'
                                            : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'}`}
                                    title={med}
                                >
                                    {med}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Selected List */}
                {selectedMeds.length > 0 && (
                    <section className="card p-6 shadow-sm border-none animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">✅ Seleccionados ({selectedMeds.length})</h2>
                        <ul className="flex flex-col gap-2">
                            {selectedMeds.map((med, idx) => (
                                <li key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                                    <span className="font-bold text-blue-900">{med}</span>
                                    <button
                                        onClick={() => handleToggleMedSelection(med)}
                                        className="text-blue-400 hover:text-red-500 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Search Section */}
                <section className="card p-6 shadow-sm border-none">
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">🔍 Buscar otra medicación</h2>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Ej: Losartan, Atenolol..."
                            className="w-full p-4 bg-slate-100 rounded-2xl border-2 border-transparent focus:border-blue-400 focus:bg-white outline-none transition-all font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searching && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    {/* Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="mt-4 max-h-60 overflow-y-auto rounded-2xl border border-slate-100 shadow-xl bg-white divide-y divide-slate-50">
                            {searchResults.map((res) => (
                                <button
                                    key={res.id}
                                    onClick={() => handleToggleMedSelection(res.full_label)}
                                    className="w-full p-4 text-left hover:bg-slate-50 flex flex-col gap-1 transition-colors"
                                >
                                    <span className="font-bold text-slate-800">{res.name}</span>
                                    <span className="text-xs text-slate-400">{res.presentation} - {res.drug}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Manual Add Trigger */}
                    {searchTerm.length >= 3 && !searching && searchResults.length === 0 && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col gap-3">
                            <p className="text-sm text-amber-800 font-medium">¿No encuentras lo que buscas? Puedes agregarlo manualmente:</p>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-fit"
                                onClick={handleAddManualMed}
                            >
                                ➕ Agregar "{searchTerm}"
                            </Button>
                        </div>
                    )}
                </section>

                {/* Notes Section */}
                <section className="card p-6 shadow-sm border-none">
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">📝 Notas (Opcional)</h2>
                    <textarea
                        className="w-full p-4 bg-slate-100 rounded-2xl border-2 border-transparent focus:border-blue-400 focus:bg-white outline-none transition-all font-medium min-h-[100px]"
                        placeholder="Ej: Retiro por secretaría el miércoles..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                </section>

                {/* Footer Submit */}
                <div className="mt-4">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full py-6 rounded-3xl shadow-lg shadow-blue-200"
                        disabled={selectedMeds.length === 0 || loading}
                        onClick={handleSubmit}
                    >
                        {loading ? 'Enviando...' : '🚀 Enviar Solicitud'}
                    </Button>
                    <p className="text-center text-[10px] text-slate-400 mt-6 uppercase tracking-widest font-black">
                        Sistema Seguro de Gestión Médica • CIMA
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PublicPrescriptionRequest;
