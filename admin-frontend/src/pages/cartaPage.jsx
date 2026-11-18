// src/pages/cartaPage.jsx
import { useCallback, useEffect, useState } from 'react'
import { Layers, Tags, UtensilsCrossed } from 'lucide-react'
import MainLayout from '../components/general/mainLayoutComponent'
import CartaTab from '../components/carta/cartaTab'
import CategoriasTab from '../components/carta/categoriasTab'
import SubcategoriasTab from '../components/carta/subcategoriasTab'
import { getCartaInit } from '../Apis/carta/cartaApi'

const TABS = [
  { id: 'carta', label: 'Carta', icon: UtensilsCrossed },
  { id: 'categorias', label: 'Categorías', icon: Tags },
  { id: 'subcategorias', label: 'Subcategorías', icon: Layers },
]

export default function CartaPage() {
  const [tab, setTab] = useState('carta')
  const [data, setData] = useState({ carta: [], categorias: [], subcategorias: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Un solo SELECT al abrir la página; los filtros trabajan sobre estos datos en el navegador.
  // Se vuelve a llamar solo después de guardar, actualizar o eliminar.
  const load = useCallback(async () => {
    try {
      const res = await getCartaInit()
      setData({ carta: res.carta, categorias: res.categorias, subcategorias: res.subcategorias })
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <MainLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Carta</h1>

        <div role="tablist" className="tabs tabs-box w-full bg-base-100 sm:w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`tab flex-1 gap-2 sm:flex-none ${tab === id ? 'tab-active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid place-items-center py-20">
            <span className="loading loading-spinner loading-lg text-primary" aria-label="Cargando" />
          </div>
        ) : error ? (
          <div role="alert" className="alert alert-error alert-soft">
            <span>{error}</span>
            <button type="button" className="btn btn-sm" onClick={() => { setLoading(true); load() }}>
              Reintentar
            </button>
          </div>
        ) : (
          // Los tres tabs quedan montados para conservar filtros y columnas al cambiar de pestaña
          <>
            <div className={tab === 'carta' ? '' : 'hidden'}>
              <CartaTab carta={data.carta} categorias={data.categorias} subcategorias={data.subcategorias} onChanged={load} />
            </div>
            <div className={tab === 'categorias' ? '' : 'hidden'}>
              <CategoriasTab categorias={data.categorias} onChanged={load} />
            </div>
            <div className={tab === 'subcategorias' ? '' : 'hidden'}>
              <SubcategoriasTab subcategorias={data.subcategorias} categorias={data.categorias} onChanged={load} />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
