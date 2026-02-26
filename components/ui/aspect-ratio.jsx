'use client'

import * as React from 'react'

// This component is now a simple placeholder <div> as the external Radix dependency
// and associated TypeScript types have been removed to comply with the request
// for a pure, self-contained JSX file without additions.
function AspectRatio({
  ...props
}) {
  return <div data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }
