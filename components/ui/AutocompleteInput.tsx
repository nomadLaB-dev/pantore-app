"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    label?: string;
    required?: boolean;
}

export const AutocompleteInput = ({ value, onChange, options, placeholder, label, required }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        if (newValue.trim() === '') {
            setFilteredOptions(options);
        } else {
            setFilteredOptions(
                options.filter(option =>
                    option.toLowerCase().includes(newValue.toLowerCase())
                )
            );
        }
        setIsOpen(true);
    };

    const handleFocus = () => {
        if (value.trim() === '') {
            setFilteredOptions(options);
        } else {
            setFilteredOptions(
                options.filter(option =>
                    option.toLowerCase().includes(value.toLowerCase())
                )
            );
        }
        setIsOpen(true);
    };

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            {label && <label className="text-xs font-bold text-gray-600 block mb-1">{label}</label>}
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    required={required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pantore-500 focus:border-transparent pr-8"
                />
                <button
                    type="button"
                    onClick={() => {
                        if (isOpen) {
                            setIsOpen(false);
                        } else {
                            handleFocus();
                        }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.map((option, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelect(option)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-pantore-50 flex items-center justify-between group"
                        >
                            <span className="text-gray-700">{option}</span>
                            {value === option && <Check className="w-3 h-3 text-pantore-600" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
