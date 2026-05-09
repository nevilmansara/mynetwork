export default function Input({ label, name, value, onChange, type = 'text', placeholder }) {
  return <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} />
}
