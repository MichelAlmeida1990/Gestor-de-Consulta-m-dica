import { useState, useCallback } from 'react';

/**
 * Hook personalizado para formatação automática de telefone
 * Formato: (XX) XXXXX-XXXX
 */
export const useTelefoneFormat = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);

  /**
   * Formata o número de telefone conforme o usuário digita
   * Remove todos os caracteres não numéricos e aplica a máscara
   */
  const formatTelefone = useCallback((input: string): string => {
    // Remove todos os caracteres não numéricos
    const numbers = input.replace(/\D/g, '');
    
    // Aplica a formatação baseada no tamanho
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    
    // Limita a 11 dígitos (formato brasileiro)
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }, []);

  /**
   * Manipula a mudança no input
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value);
    setValue(formatted);
  }, [formatTelefone]);

  /**
   * Define um valor diretamente (útil para valores vindos da API)
   */
  const setFormattedValue = useCallback((newValue: string) => {
    const formatted = formatTelefone(newValue);
    setValue(formatted);
  }, [formatTelefone]);

  /**
   * Retorna apenas os números (útil para envio para API)
   */
  const getNumbersOnly = useCallback((): string => {
    return value.replace(/\D/g, '');
  }, [value]);

  /**
   * Valida se o telefone está completo
   */
  const isValid = useCallback((): boolean => {
    const numbers = value.replace(/\D/g, '');
    return numbers.length === 10 || numbers.length === 11;
  }, [value]);

  /**
   * Retorna o telefone formatado para exibição
   */
  const getFormattedDisplay = useCallback((): string => {
    return value;
  }, [value]);

  return {
    value,
    handleChange,
    setFormattedValue,
    getNumbersOnly,
    isValid,
    getFormattedDisplay,
    formatTelefone
  };
};
