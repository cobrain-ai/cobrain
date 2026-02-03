'use client'

export interface FormFieldProps {
  label: string
  hint?: string
  children: React.ReactNode
}

export function FormField({ label, hint, children }: FormFieldProps): React.ReactElement {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {children}
      {hint && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>
      )}
    </div>
  )
}

export interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'password'
  placeholder?: string
  hint?: string
  monospace?: boolean
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  monospace = false,
}: TextFieldProps): React.ReactElement {
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}`
  const inputClasses = `
    w-full px-4 py-2 rounded-lg
    border border-gray-200 dark:border-gray-700
    bg-white dark:bg-gray-800
    focus:outline-none focus:ring-2 focus:ring-blue-500
    ${monospace ? 'font-mono text-sm' : ''}
  `

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-2">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClasses}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'off' : undefined}
        data-lpignore={type === 'password' ? 'true' : undefined}
      />
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

export interface SelectOption {
  value: string
  label: string
}

export interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly SelectOption[]
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: SelectFieldProps): React.ReactElement {
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-2">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export interface InfoBoxProps {
  children: React.ReactNode
  variant?: 'info' | 'warning' | 'error'
}

export function InfoBox({ children, variant = 'info' }: InfoBoxProps): React.ReactElement {
  const variantClasses = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
  }

  return (
    <div className={`p-4 rounded-lg border text-sm ${variantClasses[variant]}`}>
      {children}
    </div>
  )
}
