'use client'

import * as React from 'react'


function cn() {
  return Array.prototype.slice.call(arguments).flat().filter(Boolean).join(' ')
}


const buttonVariants = (props) => {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 h-10 px-4 py-2"

  if (props && props.variant === 'outline') {
    return cn(base, "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100")
  }
  return cn(base, "bg-red-600 text-white hover:bg-red-700")
}



const AlertDialogContext = React.createContext(null)
const useAlertDialog = () => React.useContext(AlertDialogContext)

function AlertDialog(props) {
  const [open, setOpen] = React.useState(false)
  const contextValue = React.useMemo(() => ({ open, setOpen }), [open])

  return (
    <AlertDialogContext.Provider value={contextValue}>
      <div data-slot="alert-dialog-root" {...props} />
    </AlertDialogContext.Provider>
  )
}

function AlertDialogTrigger(props) {
  const { setOpen } = useAlertDialog()

  return (
    <button
      onClick={() => setOpen(true)}
      data-slot="alert-dialog-trigger"
      {...props}
    />
  )
}

function AlertDialogContent({ className, children, ...props }) {
  const { open, setOpen } = useAlertDialog()

  if (!open) return null

  return (
    <div
      data-slot="alert-dialog-portal"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        data-slot="alert-dialog-overlay"
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setOpen(false)} 
      />
      <div
        data-slot="alert-dialog-content"
        className={cn(
          'bg-white fixed z-50 grid w-full max-w-lg translate-x-0 translate-y-0 gap-4 rounded-lg border p-6 shadow-2xl duration-200',
          'opacity-100 scale-100 animate-in fade-in-0 zoom-in-95', // Simplified animation class
          className,
        )}
        role="alertdialog"
        {...props}
      >
        {children}
      </div>
    </div>
  )
}


function AlertDialogHeader({ className, ...props }) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function AlertDialogFooter({ className, ...props }) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-4',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({ className, ...props }) {
  return (
    <h3
      data-slot="alert-dialog-title"
      className={cn('text-lg font-semibold text-gray-900', className)}
      {...props}
    />
  )
}

function AlertDialogDescription({ className, ...props }) {
  return (
    <p
      data-slot="alert-dialog-description"
      className={cn('text-gray-500 text-sm', className)}
      {...props}
    />
  )
}

function AlertDialogAction({ className, ...props }) {
  const { setOpen } = useAlertDialog()
  return (
    <button
      onClick={() => setOpen(false)}
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({ className, ...props }) {
  const { setOpen } = useAlertDialog()
  return (
    <button
      onClick={() => setOpen(false)}
      className={cn(buttonVariants({ variant: 'outline' }), className)}
      {...props}
    />
  )
}


export default function AlertDialogDemo() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <AlertDialog>
        <AlertDialogTrigger
          className={cn(buttonVariants(), "bg-indigo-600 text-white hover:bg-indigo-700")}
        >
          Show Alert Dialog
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p className="mt-4 text-sm text-gray-500">The dialog opens when you click the button.</p>
    </div>
  )
}
