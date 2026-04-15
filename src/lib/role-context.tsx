import { createContext, useContext } from 'react'

interface RoleContextValue {
  role: string
  userName: string
  isReadOnly: boolean
}

export const RoleContext = createContext<RoleContextValue>({
  role: 'admin',
  userName: '',
  isReadOnly: false,
})

export function useRole(): RoleContextValue {
  return useContext(RoleContext)
}
