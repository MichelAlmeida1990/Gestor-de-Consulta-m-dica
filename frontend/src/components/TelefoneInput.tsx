import React from 'react';
import { useTelefoneFormat } from '../hooks/useTelefoneFormat';

/**
 * Componente de input com formatação automática de telefone
 */
export interface TelefoneInputProps {
  value?: string;
  onChange?: (value: string, numbersOnly: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
}

export const TelefoneInput: React.FC<TelefoneInputProps> = ({
  value = '',
  onChange,
  placeholder = '(11) 99999-9999',
  className = '',
  disabled = false,
  required = false,
  name,
  id
}) => {
  const telefoneFormat = useTelefoneFormat(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    telefoneFormat.handleChange(e);
    
    if (onChange) {
      const numbersOnly = telefoneFormat.getNumbersOnly();
      onChange(telefoneFormat.value, numbersOnly);
    }
  };

  return (
    <input
      type="tel"
      value={telefoneFormat.value}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={`form-input ${className}`}
      disabled={disabled}
      required={required}
      name={name}
      id={id}
      maxLength={15} // (XX) XXXXX-XXXX = 15 caracteres
      autoComplete="tel"
    />
  );
};
