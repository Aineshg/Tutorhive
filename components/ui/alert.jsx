'use client'

import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
const cn = (...inputs) => inputs.filter(Boolean).flat().join(' ')


const alertVariants = (props) => {
  
  let classes = 'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[20px_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current'

  const variant = (props && props.variant) || 'default'

  if (variant === 'destructive') {
    classes = cn(
      classes,
      'border-red-400 bg-red-50 text-red-800 [&>svg]:text-red-600'
    )
  } else {
    classes = cn(
      classes,
      'border-gray-300 bg-gray-50 text-gray-800 [&>svg]:text-gray-600'
    )
  }
  return classes
}

const AlertIcon = (props) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>)



function Alert({
  className,
  variant,
  children,
  ...props
}) {
  const hasIcon = React.Children.toArray(children).some(child => child.type === AlertIcon);

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), hasIcon && 'has-[>svg]:grid-cols-[20px_1fr]', className)}
      {...props}
    >
      {hasIcon && React.Children.toArray(children).find(child => child.type === AlertIcon)}
      
      {React.Children.toArray(children).filter(child => child.type !== AlertIcon)}
    </div>
  )
}

function AlertTitle({ className, ...props }) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight',
        className,
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-gray-600 col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }

export default function AlertDemo() {
  return (
    <div className="p-8 space-y-4 max-w-xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold font-serif mb-4">Alert Component Demos</h2>

      <Alert>
        <AlertIcon />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          <p>You can add detailed information here about an upcoming event or change.</p>
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertIcon />
        <AlertTitle>Potential Data Loss</AlertTitle>
        <AlertDescription>
          <p>
            Please review the following settings immediately. Continuing without addressing this could result in loss of unsaved changes.
          </p>
        </AlertDescription>
      </Alert>

      <Alert>
        <AlertTitle>Information Update</AlertTitle>
        <AlertDescription>
          <p>The system has been updated successfully.</p>
        </AlertDescription>
      </Alert>
    </div>
  )
}
