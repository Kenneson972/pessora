import { useAuth } from '../contexts/AuthContext'

export function useIsOraPlus() {
  const { subscription } = useAuth()
  const isOraPlus = subscription?.plan === 'ora_plus' && subscription?.status === 'active'

  function effectiveUnitPrice(publicPrice: number): number {
    return publicPrice
  }

  return { isOraPlus, effectiveUnitPrice }
}
