export default function ProgressBar({ percent, color = '#1E4D8C', label }) {
  return (
    <div className="bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="bar-fill" style={{ width: `${percent}%`, background: color }} />
    </div>
  )
}
