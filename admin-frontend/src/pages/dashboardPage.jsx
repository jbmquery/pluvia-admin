// src/pages/dashboardPage.jsx
import MainLayout from '../components/general/mainLayoutComponent'

export default function DashboardPage() {
  return (
    <MainLayout>
      <section className="rounded-3xl bg-linear-to-br from-indigo-600 via-violet-700 to-indigo-950 p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Dashboard</h1>
        <p className="mt-2 max-w-prose text-white/80">
          Estás en el dashboard. Aquí se mostrarán los gráficos y métricas más adelante.
        </p>
      </section>
    </MainLayout>
  )
}
