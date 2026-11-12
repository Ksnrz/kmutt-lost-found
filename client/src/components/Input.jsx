import './Input.css';

function Input({
  type = 'text',
  placeholder,
  onChange,
  value,
}) {
  return (
    <div className="custom-input-wrapper">
      <input
        type={type}
        className="custom-input"
        placeholder={placeholder}
        onChange={onChange}
        value={value ?? ''}
      />
    </div>
  );
}

export default Input;