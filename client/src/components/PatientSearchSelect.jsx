import React from 'react';
import AsyncSelect from 'react-select/async';
import api from '../api/axios';

const PatientSearchSelect = ({ value, onChange, placeholder = "Buscar paciente (Nombre, DNI, Dirección)..." }) => {

    const loadOptions = async (inputValue) => {
        if (!inputValue || inputValue.length < 2) return [];
        try {
            const res = await api.get(`/users/patients?search=${inputValue}`);
            return res.data.map(p => ({
                value: p.id,
                label: `${p.full_name} - DNI: ${p.dni || 'N/A'} - ${p.address || ''}`,
                patient: p // Pass full object if needed
            }));
        } catch (err) {
            console.error("Error searching patients", err);
            return [];
        }
    };

    // Handle initial value (if ID is passed, we might need to fetch label, 
    // but for now assume parent manages state or we just show selected)
    // For simplicity in this Refactor, if value is passed, we expect the Parent to pass the full object or we handle ID separately.
    // Given the current usage in Appointments, 'selectedPatient' is just an ID. 
    // To show the label correctly for an existing ID without fetching, we might need a prop `initialPatient`.
    // However, specifically for *creating* new appointments, we usually start empty.

    const handleChange = (selectedOption) => {
        onChange(selectedOption ? selectedOption.value : '');
    };

    return (
        <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadOptions}
            onChange={handleChange}
            placeholder={placeholder}
            noOptionsMessage={() => "No se encontraron pacientes"}
            loadingMessage={() => "Buscando..."}
            styles={{
                control: (base) => ({
                    ...base,
                    borderColor: '#e2e8f0',
                    borderRadius: '0.375rem',
                    padding: '2px'
                })
            }}
        />
    );
};

export default PatientSearchSelect;
