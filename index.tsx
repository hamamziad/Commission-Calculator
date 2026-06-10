import { createFileRoute } from '@tanstack/react-router'
import CommissionCalculator from '../components/Calculator'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return <CommissionCalculator />
}
