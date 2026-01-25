import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';

const InstitutionList = ({ institutions, loading, onEdit, onDelete }) => {
    if (loading) return <div>Cargando...</div>;

    if (institutions.length === 0) {
        return (
            <div className="card p-8 text-center text-main-500">
                <p>No hay instituciones registradas.</p>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            <table className="table-base w-full">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Monto Base</th>
                        <th>Deuda Pendiente</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {institutions.map(inst => (
                        <tr key={inst.id}>
                            <td className="font-medium text-main-800">{inst.name}</td>
                            <td className="font-mono text-blue-700">${inst.base_price}</td>
                            <td className="font-mono text-red-600 font-bold">${inst.total_debt}</td>
                            <td>
                                <Badge variant={inst.status === 'active' ? 'green' : 'red'}>
                                    {inst.status === 'active' ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </td>
                            <td className="flex gap-2">
                                <Button variant="ghost" size="sm-compact" onClick={() => onEdit(inst)}>
                                    ✏️
                                </Button>
                                <Button variant="ghost" size="sm-compact" className="text-red-500 hover:text-red-700" onClick={() => onDelete(inst.id)}>
                                    🗑️
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default React.memo(InstitutionList);
