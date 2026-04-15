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
                <Icon name="SEARCH" className="search-box__icon" />
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
