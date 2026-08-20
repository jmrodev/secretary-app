import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Loading } from '@/components/atoms/Loading';
import styles from './SecretaryPermissionsPanel.module.css';

/**
 * SecretaryPermissionsPanel (Molecule/Presentational).
 * Lists secretaries with a checkbox per row and grant/revoke actions.
 * All state and side effects live in useSecretaryPermissions.
 */
export const SecretaryPermissionsPanel = ({
    t,
    secretaries = [],
    loading = false,
    updating = false,
    selectedIds = [],
    grantToAll = false,
    onToggleSelect,
    onToggleGrantAll,
    onGrant,
    onRevoke
}) => {
    const hasTargets = grantToAll || selectedIds.length > 0;

    return (
        <div className={styles.SecretaryPermissionsPanel__card}>
            <h3 className={styles.SecretaryPermissionsPanel__title}>
                {t('grant_permissions_title')}
            </h3>
            <p className={styles.SecretaryPermissionsPanel__hint}>
                {t('grant_permissions_hint')}
            </p>

            {loading ? (
                <Loading size="sm" variant="inline" />
            ) : secretaries.length === 0 ? (
                <p className={styles.SecretaryPermissionsPanel__empty}>
                    {t('no_secretaries')}
                </p>
            ) : (
                <>
                    <label className={styles.SecretaryPermissionsPanel__grantAll}>
                        <input
                            type="checkbox"
                            checked={grantToAll}
                            onChange={onToggleGrantAll}
                            disabled={updating}
                        />
                        <span>{t('grant_all')}</span>
                    </label>

                    <ul className={styles.SecretaryPermissionsPanel__list}>
                        {secretaries.map(sec => (
                            <li key={sec.id} className={styles.SecretaryPermissionsPanel__row}>
                                <label className={styles.SecretaryPermissionsPanel__rowLabel}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(sec.id)}
                                        onChange={() => onToggleSelect(sec.id)}
                                        disabled={updating}
                                    />
                                    <span className={styles.SecretaryPermissionsPanel__rowName}>
                                        {sec.full_name || sec.username}
                                    </span>
                                    {sec.can_manage_users ? (
                                        <span className={styles.SecretaryPermissionsPanel__badge}>
                                            {t('user_header')}
                                        </span>
                                    ) : null}
                                </label>
                            </li>
                        ))}
                    </ul>

                    <div className={styles.SecretaryPermissionsPanel__actions}>
                        <Button
                            variant="primary"
                            disabled={!hasTargets || updating}
                            onClick={onGrant}
                        >
                            {t('grant_selected')}
                        </Button>
                        <Button
                            variant="outline"
                            disabled={!hasTargets || updating}
                            onClick={onRevoke}
                        >
                            {t('revoke_selected')}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};