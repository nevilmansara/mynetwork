export default function Button({ children, onClick, variant = 'primary', disabled = false, type = 'button' }) {
  return <button type={type} onClick={onClick} disabled={disabled}>Button — placeholder</button>
}
