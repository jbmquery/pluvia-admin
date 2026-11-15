// src/components/general/footerComponent.jsx
export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-4 text-center text-xs text-base-content/60">
      © {new Date().getFullYear()} Pluvia. Todos los derechos reservados.
    </footer>
  )
}
