'use client'

import * as React from 'react'

const cn = (...inputs) => inputs.filter(Boolean).flat().join(' ')

const getBadgeClasses = (variant = 'default') => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 transition-colors overflow-hidden shadow-sm'

  const variantClasses = {
    default: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'border-transparent bg-gray-200 text-gray-800 hover:bg-gray-300',
    destructive: 'border-transparent bg-red-600 text-white hover:bg-red-700',
    outline: 'text-gray-900 border-gray-300 hover:bg-gray-50',
  }

  return cn(baseClasses, variantClasses[variant])
}

function Badge({
  className,
  variant,
  ...props
}) {
  return (
    <span
      data-slot="badge"
      className={cn(getBadgeClasses(variant), className)}
      {...props}
    />
  )
}

export default function BadgeDemo() {
  return (
    <div className="p-8 space-y-6 max-w-xl mx-auto bg-gray-50 rounded-xl shadow-2xl">
      <style>
        {`
          .font-serif { font-family: 'Playfair Display', serif; }
        `}
      </style>
      <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Badge Component Demo</h2>
      <p className="text-gray-600">Displays various status indicators using different variants.</p>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant="default">Status: Active</Badge>
          <span className="text-sm text-gray-500">- default (Primary Action)</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">In Review</Badge>
          <span className="text-sm text-gray-500">- secondary (Neutral/Information)</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="destructive">Error</Badge>
          <span className="text-sm text-gray-500">- destructive (Warning/Error)</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm border-blue-600 text-blue-600 bg-blue-50">
            Feature Flag
          </Badge>
          <span className="text-sm text-gray-500">- outline (Subtle Border)</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default" className="text-sm rounded-full px-3 py-1 bg-green-500 hover:bg-green-600">
            Completed
          </Badge>
          <span className="text-sm text-gray-500">- Custom Styling</span>
        </div>
      </div>
    </div>
  )
}

export { Badge, getBadgeClasses }
