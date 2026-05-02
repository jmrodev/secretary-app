import React, { useState, useEffect } from 'react';
import { DoctorSelector } from '@/features/doctors';
import defaultHeroBg from '@/features/dashboard/assets/dashboard_hero.png';
import './PageHeader.css';

/**
 * LiveClock — shows current time, updates every second.
 * Atom interno del PageHeader premium.
 */
const LiveClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const dateLabel = time.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const timeLabel = time.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    return (
        <div className="page-header__clock">
            <span className="page-header__clock-date">{dateLabel}</span>
            <span className="page-header__clock-separator">·</span>
            <span className="page-header__clock-time">{timeLabel}</span>
        </div>
    );
};

/**
 * PageHeader Molecule (Layout Component).
 * Con variant="premium": header unificado Clinical Curator.
 * El subtítulo (fecha + hora en vivo) es idéntico en todas las páginas.
 * Solo el `title` varía por página.
 */
const PageHeader = ({
    title,
    subtitle,         // ignorado en premium
    children,
    actionSlot,
    divider = false,
    className = '',
    variant = 'standard',
    backgroundUrl,
    hideDoctorSelector = false,
}) => {
    const isPremium = variant === 'premium';

    if (!isPremium) {
        return (
            <header className={`page-header ${divider ? 'page-header--divider' : ''} ${className} animate-fadeIn`}>
                <div className="page-header__content">
                    <div className="page-header__title-container">
                        <h1 className="page-header__title">{title}</h1>
                        {subtitle && <div className="page-header__subtitle">{subtitle}</div>}
                    </div>
                    {(actionSlot || children) && (
                        <div className="page-header__actions">
                            {actionSlot || children}
                        </div>
                    )}
                </div>
            </header>
        );
    }

    const resolvedBg = backgroundUrl || defaultHeroBg;

    return (
        <header className={`page-header--premium ${className} animate-fadeIn`}>
            <img
                src={resolvedBg}
                alt=""
                className="page-header__background-img"
                aria-hidden="true"
            />

            <div className="page-header--premium__content">
                <div className="page-header--premium__title-container">
                    <h1 className="page-header--premium__title">{title}</h1>
                    <div className="page-header--premium__subtitle">
                        <LiveClock />
                        {!hideDoctorSelector && <DoctorSelector />}
                    </div>
                </div>

                {(actionSlot || children) && (
                    <div className="page-header--premium__actions">
                        {actionSlot || children}
                    </div>
                )}
            </div>
        </header>
    );
};

export default PageHeader;
