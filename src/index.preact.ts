// Re-export components with Preact types
import DashboardComponent from './components/Dashboard'
export { default as Dashboard } from './components/Dashboard'
export { DashboardToolbar } from './components/DashboardToolbar'
export { Button } from './ui/button'
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip'
export * from './types/preact'
export * from './constants'
import './styles.css'

// Default export for convenience
export default DashboardComponent
