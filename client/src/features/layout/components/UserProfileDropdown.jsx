import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/atoms/Icon';
import styles from './UserProfileDropdown.module.css';

const THEMES = ['dark', 'dim', 'light'];

export const UserProfileDropdown = ({
    user,
    logout,
    language,
    toggleLanguage,
    t,
    isStaff
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem('theme') || 'dark';
        }
        return 'dark';
    });

    useEffect(() => {
        const root = document.documentElement;
        THEMES.forEach(tName => {
            document.body.classList.remove(`theme-${tName}`);
        });
        root.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        document.body.classList.add(`theme-${theme}`);
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('theme', theme);
        }
    }, [theme]);

    const handleToggleTheme = () => {
        setTheme(prev => {
            const nextIndex = (THEMES.indexOf(prev) + 1) % THEMES.length;
            return THEMES[nextIndex];
        });
    };

    // Close on click outside and escape
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    if (!user) return null;

    const fullName = user.full_name || user.name || user.username || 'Usuario';
    const initials = fullName
        .split(' ')
        .map(n => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U';

    const roleName = user.role === 'admin' ? t('admin') || 'Administrador' :
                     user.role === 'doctor' ? t('doctor') || 'Médico' :
                     user.role === 'secretary' ? t('secretary') || 'Secretaria' :
                     user.role || 'Usuario';

    const getThemeLabel = () => {
        if (theme === 'light') return t('theme_light') || 'Modo Claro';
        if (theme === 'dim') return 'Modo Atenuado';
        return t('theme_dark') || 'Modo Oscuro';
    };

    const getThemeIcon = () => {
        if (theme === 'light') return 'light_mode';
        if (theme === 'dim') return 'contrast';
        return 'dark_mode';
    };

    return (
        <div className={styles.UserProfileDropdown__root} ref={dropdownRef}>
            <button
                type="button"
                className={`${styles.UserProfileDropdown__trigger} ${isOpen ? styles.UserProfileDropdown__triggerOpen : ''}`}
                onClick={() => setIsOpen(prev => !prev)}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <div className={styles.UserProfileDropdown__avatar}>
                    {initials}
                </div>
                <div className={styles.UserProfileDropdown__userInfo}>
                    <span className={styles.UserProfileDropdown__userName}>{fullName}</span>
                    <span className={styles.UserProfileDropdown__userRole}>{roleName}</span>
                </div>
                <div className={`${styles.UserProfileDropdown__chevron} ${isOpen ? styles.UserProfileDropdown__chevronRotated : ''}`}>
                    <Icon name="expand_more" size="1.1rem" />
                </div>
            </button>

            {isOpen && (
                <div className={styles.UserProfileDropdown__panel} role="menu">
                    {/* Header with user info */}
                    <div className={styles.UserProfileDropdown__header}>
                        <div className={styles.UserProfileDropdown__headerAvatar}>
                            {initials}
                        </div>
                        <div className={styles.UserProfileDropdown__headerDetails}>
                            <span className={styles.UserProfileDropdown__headerName}>{fullName}</span>
                            <span className={styles.UserProfileDropdown__headerRoleBadge}>{roleName}</span>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className={styles.UserProfileDropdown__section}>
                        <button
                            type="button"
                            className={styles.UserProfileDropdown__item}
                            onClick={handleToggleTheme}
                        >
                            <div className={styles.UserProfileDropdown__itemLeft}>
                                <Icon name={getThemeIcon()} size="1.1rem" />
                                <span>{t('theme_mode') || 'Tema'}</span>
                            </div>
                            <span className={styles.UserProfileDropdown__badgeValue}>{getThemeLabel()}</span>
                        </button>

                        <button
                            type="button"
                            className={styles.UserProfileDropdown__item}
                            onClick={toggleLanguage}
                        >
                            <div className={styles.UserProfileDropdown__itemLeft}>
                                <Icon name="language" size="1.1rem" />
                                <span>{t('language') || 'Idioma'}</span>
                            </div>
                            <span className={styles.UserProfileDropdown__badgeValue}>{language === 'es' ? 'Español' : 'English'}</span>
                        </button>

                        {isStaff && (
                            <Link
                                to="/config?tab=users"
                                className={styles.UserProfileDropdown__item}
                                onClick={() => setIsOpen(false)}
                            >
                                <div className={styles.UserProfileDropdown__itemLeft}>
                                    <Icon name="settings" size="1.1rem" />
                                    <span>{t('system_config') || 'Configuración'}</span>
                                </div>
                            </Link>
                        )}
                    </div>

                    <div className={styles.UserProfileDropdown__divider} />

                    {/* Logout */}
                    <div className={styles.UserProfileDropdown__section}>
                        <button
                            type="button"
                            className={`${styles.UserProfileDropdown__item} ${styles.UserProfileDropdown__logoutItem}`}
                            onClick={() => {
                                setIsOpen(false);
                                logout();
                            }}
                        >
                            <div className={styles.UserProfileDropdown__itemLeft}>
                                <Icon name="logout" size="1.1rem" />
                                <span>{t('sign_out') || 'Cerrar Sesión'}</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
