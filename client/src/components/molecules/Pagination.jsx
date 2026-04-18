import React from 'react';
<<<<<<< HEAD
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
=======
import Button from '@/components/atoms/Button';
>>>>>>> main
import './Pagination.css';

/**
 * Pagination molecule.
 */
const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    totalCount,
    itemsShowing,
    t
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="pagination">
            <span className="pagination__info">
                {t('showing')} {itemsShowing} {t('of')} {totalCount}
            </span>
            <div className="pagination__controls">
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    icon={<Icon name="CHEVRON_LEFT" />}
                >
                    {t('previous')}
                </Button>
                <div className="pagination__page-indicator">
                    {currentPage} / {totalPages}
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    iconTrailing={<Icon name="CHEVRON_RIGHT" />}
                >
                    {t('next')}
                </Button>
            </div>
        </div>
    );
};

export default Pagination;
