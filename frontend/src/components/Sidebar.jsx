import {
  LayoutDashboard,
  Settings,
  Activity,
  Factory,
  ChevronLeft,
} from 'lucide-react'

import { NavLink } from 'react-router-dom'
import useAppStore from '../store/useAppStore'

const menus = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Production',
    path: '/production',
    icon: Factory,
  },
  {
    name: 'OEE',
    path: '/oee',
    icon: Activity,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
  },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <>
      <aside
        className={`
          hidden md:flex flex-col
          bg-white border-r border-slate-200
          transition-all duration-300
          ${sidebarCollapsed ? 'w-20' : 'w-44'}
        `}
      >
        <button
          onClick={toggleSidebar}
          className="p-4 flex justify-end "
        >
          <ChevronLeft />
        </button>

    

        <nav className="space-y-2 px-3">
          {menus.map((menu) => {
            const Icon = menu.icon

            return (
              <NavLink
                key={menu.name}
                to={menu.path}
                className={({ isActive }) =>
                  `
                    flex items-center gap-3 rounded-xl px-4 py-3
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-[#1D60AB] text-white'
                        : 'hover:bg-slate-100 text-slate-700'
                    }
                  `
                }
              >
                <Icon size={20} />
                {!sidebarCollapsed && <span>{menu.name}</span>}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex justify-around py-3">
        {menus.map((menu) => {
          const Icon = menu.icon

          return (
            <NavLink
              key={menu.name}
              to={menu.path}
              className="flex flex-col items-center text-xs"
            >
              <Icon size={20} />
              <span>{menu.name}</span>
            </NavLink>
          )
        })}
      </div>
    </>
  )
}