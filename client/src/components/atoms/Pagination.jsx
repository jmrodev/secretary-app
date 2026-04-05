import React from 'react';
import Button from './Button';
import Icon from './Icon';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange, t }) => {
    if (totalPages <= 1) return null;

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
        <div className="pagination">
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
            
            <div className="pagination__pages">
                {start > 1 && <span className="pagination__ellipsis">...</span>}
                {pages.map(p => (
                    <Button
                        key={p}
                        variant={p === currentPage ? 'primary' : 'ghost'}
                        size="sm-compact"
                        onClick={() => onPageChange(p)}
                        className="pagination__page-btn"
                    >
                        {p}
                    </Button>
                ))}
                {end < totalPages && <span className="pagination__ellipsis">...</span>}
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
    );
};

export default Pagination;
