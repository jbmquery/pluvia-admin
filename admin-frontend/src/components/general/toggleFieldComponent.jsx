// src/components/general/toggleFieldComponent.jsx
export default function ToggleField({ label, ...rest }) {
  return (
    <label className="flex h-12 w-full cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-base-300/60 px-4">
      <span className="text-sm font-medium text-base-content/80">{label}</span>
      <input type="checkbox" className="toggle toggle-success" {...rest} />
    </label>
  )
}
