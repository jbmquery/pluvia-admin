// src/components/general/authShellComponent.jsx
// Fondo con portada + tarjeta centrada. Lo usan login y restaurar contraseña
// (sin header, footer ni sidebar).
import portada from '../../img/portada_web4.webp'
import logo from '../../img/logo_pluvia_blanco.webp'

export default function AuthShell({ title, subtitle, children }) {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden p-4">
      <img src={portada} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-base-200/70 via-base-200/80 to-base-200/95" />

      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-base-100/80 p-6 shadow-2xl backdrop-blur-md sm:p-10">
        <img
          src={logo}
          width={700}
          height={174}
          alt="Pluvia"
          className="mx-auto mb-6 h-12 w-auto"
        />
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 mb-6 text-sm text-base-content/70">{subtitle}</p>}
        {children}
      </section>
    </main>
  )
}
