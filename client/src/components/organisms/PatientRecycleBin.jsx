import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';

const PatientRecycleBin = ({
    recycleItems = [],
    onRestore,
    onPermanentDelete,
    loading
}) => {
    if (loading) {
        return <div className="p-8 text-center text-muted">Cargando papelera...</div>;
    }

    if (recycleItems.length === 0) {
        return (
            <div className="card p-12 text-center text-muted border-dashed border-2 border-slate-200">
                <span className="text-4xl block mb-2">🗑️</span>
                <p>La papelera está vacía.</p>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="m-0 text-slate-700">Pacientes Eliminados</h3>
                <span className="text-xs text-muted">Total: {recycleItems.length}</span>
            </div>
            <table className="table-base w-full">
                <thead>
                    <tr>
                        <th>Paciente</th>
                        <th>DNI</th>
                        <th>Fecha Eliminación</th>
                        <th className="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {recycleItems.map(item => (
                        <tr key={item.id}>
                            <td className="font-bold text-slate-700">{item.full_name || item.username}</td>
                            <td>{item.dni || '-'}</td>
                            <td className="text-sm text-slate-500">
                                {new Date(item.deleted_at || item.created_at).toLocaleDateString()}
                            </td>
                            <td className="text-right flex justify-end gap-2">
                                <Button
                                    size="sm-compact"
                                    variant="success"
                                    onClick={() => onRestore && onRestore(item.id)}
                                    title="Restaurar"
                                >
                                    ♻️ Restaurar
                                </Button>
                                {/* Permanent delete might not be implemented yet */}
                                {/*
                                <Button 
                                    size="sm-compact" 
                                    variant="danger" 
                                    onClick={() => onPermanentDelete && onPermanentDelete(item.id)}
                                >
                                    ✕
                                </Button>
                                */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default React.memo(PatientRecycleBin);
