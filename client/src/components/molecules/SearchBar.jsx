<<<<<<< HEAD
=======
import React from 'react';
>>>>>>> main
import Icon from '@/components/atoms/Icon';
import './SearchBar.css';

/**
 * SearchBar molecule.
 * Generic search input with icon.
 */
const SearchBar = ({ value, onChange, placeholder, className = '' }) => {
    return (
        <div className={`search-box ${className}`}>
            <div className="search-box__wrapper">
<<<<<<< HEAD
                <Icon name="SEARCH" className="search-box__icon" />
=======
                <span className="search-box__icon"><Icon name="search" /></span>
>>>>>>> main
                <input
                    type="text"
                    placeholder={placeholder || "Buscar..."}
                    className="search-box__input"
                    value={value}
                    onChange={onChange}
                />
            </div>
        </div>
    );
};

export default SearchBar;
