import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import styles from './Pagination.module.css';

/**
 * Pagination atom.
 * Renders numbered page controls with optional item count info.
 *
 * @param {number}   currentPage      - Current active page (1-indexed)
 * @param {number}   totalPages       - Total number of pages
 * @param {Function} onPageChange     - Callback(pageNumber)
 * @param {Function} t                - Translation function
 * @param {number}   [totalCount]     - Total item count (shows "X of Y" when provided with itemsShowing)
 * @param {number}   [itemsShowing]   - Items visible on current page
 */
export const Pagination = ({ currentPage, totalPages, onPageChange, t, totalCount, itemsShowing }) => {
    if (!totalCount && totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return (
        <div className={`${styles.Pagination__root}`}>
            {(totalCount !== undefined && itemsShowing !== undefined) && (
                <span className={`${styles.Pagination__info}`}>
                    {t?.('showing') ?? 'Mostrando'} {itemsShowing} {t?.('of') ?? 'de'} {totalCount}
                </span>
            )}
            
            {totalPages > 1 && (
                <div className={`${styles.Pagination__controls}`}>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        icon={<Icon name="FIRST_PAGE" size="1.2rem" />}
                    />
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        icon={<Icon name="CHEVRON_LEFT" size="1.2rem" />}
                    />
                    
                    <div className={`${styles.Pagination__pages}`}>
                        {start > 1 && <span className={`${styles.Pagination__ellipsis}`}>…</span>}
                        {pages.map(p => (
                            <Button
                                key={p}
                                variant={p === currentPage ? 'primary' : 'ghost'}
                                size="sm-compact"
                                onClick={() => onPageChange(p)}
                                className={`${styles.Pagination__pageBtn}`}
                            >
                                {p}
                            </Button>
                        ))}
                        {end < totalPages && <span className={`${styles.Pagination__ellipsis}`}>…</span>}
                    </div>

                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        icon={<Icon name="CHEVRON_RIGHT" size="1.2rem" />}
                    />
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        icon={<Icon name="LAST_PAGE" size="1.2rem" />}
                    />
                </div>
            )}
        </div>
    );
};
