import { useState, useEffect } from 'react';

export const useForm = (initialValues, validate, storageKey) => {
  const [values, setValues] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : initialValues;
      } catch (err) {
        console.error("Error loading saved form:", err);
      }
    }
    return initialValues;
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(values));
    }
  }, [values, storageKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValues = { ...values, [name]: value };
    setValues(newValues);

    if (validate) {
      setErrors(validate(newValues));
    }
  };

  const resetForm = (newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
  };

  const validateForm = () => {
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      return Object.keys(validationErrors).length === 0;
    }
    return true;
  };

  return { values, errors, handleChange, resetForm, setValues, validateForm, resetForm };
};