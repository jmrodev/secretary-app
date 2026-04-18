import React from 'react';
import UserManagement from '@/features/users/components/UserManagement';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

const UserManager = ({ t }) => {
    return (
        <div className="user-manager h-full flex flex-col">
            <header className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-slate-800">{t('user_management') || 'Gestión de Usuarios'}</h2>
                <p className="text-slate-500">{t('manage_users_subtitle') || 'Administra cuentas de médicos, secretarias y administradores.'}</p>
            </header>

            <div className="flex gap-4 mb-6">
                <Button
                    variant="primary"
                    onClick={() => window.dispatchEvent(new CustomEvent('OPEN_USER_MODAL', { detail: 'CREATE' }))}
                    icon={<Icon name="add" size="1.1rem" />}
                >
                    {t('add_user') || 'Agregar Usuario'}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    icon={<Icon name="sync" size="1.1rem" />}
                >
                    {t('refresh') || 'Actualizar'}
                </Button>
            </div>

            <div className="flex-1 dashboard-card dashboard-card--highlighted overflow-hidden">
                <div className="h-full overflow-y-auto">
                    <UserManagement excludeRoles={['patient']} />
                </div>
            </div>
        </div>
    );
};

export default UserManager;
