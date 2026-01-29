import React from 'react'
import './input.styles.scss'

interface InputProps {
  label: string
  placeholder?: string
  type?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  prefix?: string
  name?: string
}

const Input = ({ 
  label, 
  placeholder, 
  type = 'text', 
  value, 
  onChange,
  prefix,
  name
}: InputProps) => {
  return (
    <div className='input-field'>
      <label className='input-field__label'>{label}</label>
      <div className={`input-field__wrapper ${prefix ? 'input-field__wrapper--with-prefix' : ''}`}>
        {prefix && <span className='input-field__prefix'>{prefix}</span>}
        <input 
          type={type}
          className='input-field__input'
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          name={name}
        />
      </div>
    </div>
  )
}

export default Input
