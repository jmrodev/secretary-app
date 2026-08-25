import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Switch } from '@/components/atoms/Switch';
import { api } from '@/api/axios';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './SecretaryPermissionsModal.module.css';

const PERMISSION_CONFIG = [
    { key: 'can_manage_users', labelKey: 'perm_can_manage_users', descKey: 'perm_can_manage_users_desc' },
    { key: 'can_crud_appointments', labelKey: 'perm_can_crud_appointments', descKey: 'perm_can_crud_appointments_desc' },
    { key: 'can_edit_past_appointments', labelKey: 'perm_can_edit_past_appointments', descKey: 'perm_can_edit_past_appointments_desc' },
    { key: 'can_crud_requests', labelKey: 'perm_can_crud_requests', descKey: 'perm_can_crud_requests_desc' },
    { key: 'can_crud_prescriptions', labelKey: 'perm_can_crud_prescriptions', descKey: 'perm_can_crud_prescriptions_desc' },
    { key: 'can_crud_licenses', labelKey: 'perm_can_crud_licenses', descKey: 'perm_can_crud_licenses_desc' },
    { key: 'can_crud_files', labelKey: 'perm_can_crud_files', descKey: 'perm_can_crud_files_desc' },
    { key: 'can_crud_finances', labelKey: 'perm_can_crud_finances', descKey: 'perm_can_crud_finances_desc' },
];

const getInitialPermissions = (sec) => {
    if (!sec) return {};
    const initial = {};
    PERMISSION_CONFIG.forEach(({ key }) => {
        initial[key] = Boolean(
            sec.permissions?.[key] ?? 
            sec[key] ?? 
            (key === 'can_manage_users' ? sec.canManageUsers : false)
        );
    });
    return initial;
};

export const SecretaryPermissionsModal = ({
    isOpen,
    onClose,
    secretary,
    onSaveSuccess
}) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const [permissions, setPermissions] = useState(() => getInitialPermissions(secretary));
    const [saving, setSaving] = useState(false);
    const [prevSecretaryId, setPrevSecretaryId] = useState(secretary?.id);

    if (secretary?.id !== prevSecretaryId) {
        setPrevSecretaryId(secretary?.id);
        setPermissions(getInitialPermissions(secretary));
    }

    const handleToggle = (key, value) => {
        setPermissions(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = async () => {
        if (!secretary?.id) return;
        setSaving(true);
        try {
            await api.put(`/users/admin/users/${secretary.id}/permissions`, permissions);
            showMessage(t('permission_updated'), 'success');
            if (onSaveSuccess) onSaveSuccess();
            onClose();
        } catch (err) {
            console.error('[SecretaryPermissionsModal] Save error:', err);
            const errMsg = err.response?.data?.error || err.response?.data?.message || t('permission_update_failed');
            showMessage(errMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !secretary) return null;

    const secretaryName = secretary.full_name || secretary.username || '';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('secretary_permissions_modal_title')}: ${secretaryName}`}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={saving}>
                        {t('cancel')}
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? t('saving_permissions') : t('confirm')}
                    </Button>
                </>
            }
        >
            <p className={styles.SecretaryPermissionsModal__hint}>
                {t('secretary_permissions_modal_desc')}
            </p>
            <div className={styles.SecretaryPermissionsModal__grid}>
                {PERMISSION_CONFIG.map(({ key, labelKey, descKey }) => (
                    <div key={key} className={styles.SecretaryPermissionsModal__item}>
                        <div className={styles.SecretaryPermissionsModal__itemHeader}>
                            <span className={styles.SecretaryPermissionsModal__itemTitle}>
                                {t(labelKey)}
                            </span>
                            <Switch
                                id={`perm-${key}`}
                                label={t(labelKey)}
                                checked={Boolean(permissions[key])}
                                onChange={(checked) => handleToggle(key, checked)}
                                disabled={saving}
                            />
                        </div>
                        <span className={styles.SecretaryPermissionsModal__itemDesc}>
                            {t(descKey)}
                        </span>
                    </div>
                ))}
            </div>
        </Modal>
    );
};
