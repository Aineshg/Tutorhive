"use client"

import * as React from 'react'

/**
 * This component set has been converted from TSX to JSX.
 * It includes mock implementations for 'cn' and 'AvatarPrimitive'
 * to make it self-contained and runnable without external Radix imports.
 */

// Utility function to mock 'cn' (class names) for merging strings
const cn = (...inputs) => inputs.filter(Boolean).flat().join(' ');

// Avatar Image Component with error handling
function AvatarImageComponent(props) {
  const [imageError, setImageError] = React.useState(false);
  
  if (imageError || !props.src) {
    return null; // Don't render image if error or no src, let fallback show
  }
  
  return <img {...props} onError={(e) => {
    setImageError(true);
    e.target.onerror = null;
  }}/>;
}

// Mocking the Radix Primitives for standalone functionality
const AvatarPrimitive = {
  Root: (props) => <div {...props} />,
  Image: AvatarImageComponent,
  Fallback: (props) => <div {...props} />,
};


function Avatar({ className, ...props }) {
  // Removed TS annotation: React.ComponentProps<typeof AvatarPrimitive.Root>
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        // Retaining the original styling and standard size
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }) {
  // Removed TS annotation: React.ComponentProps<typeof AvatarPrimitive.Image>
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }) {
  // Removed TS annotation: React.ComponentProps<typeof AvatarPrimitive.Fallback>
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        // Replaced 'bg-muted' with 'bg-gray-200' for reliable Tailwind styling
        'bg-gray-200 flex size-full items-center justify-center rounded-full text-gray-600 font-medium',
        className,
      )}
      {...props}
    />
  );
}

// Example usage to make the file runnable
export default function App() {
    return (
        <div className="p-8 space-y-4 font-sans bg-white min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 border-b pb-2 mb-6">Avatar Component (JSX Conversion)</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Small Avatar */}
                <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Standard (size-8)</p>
                    <Avatar>
                        <AvatarImage src="https://placehold.co/32x32/14B8A6/ffffff?text=U1" alt="User 1" />
                        <AvatarFallback>U1</AvatarFallback>
                    </Avatar>
                </div>

                {/* Medium Avatar with Custom Size */}
                <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Medium (size-12)</p>
                    <Avatar className="size-12">
                        <AvatarImage src="https://placehold.co/48x48/2563EB/ffffff?text=JS" alt="John Smith" />
                        <AvatarFallback>JS</AvatarFallback>
                    </Avatar>
                </div>

                {/* Fallback Example */}
                <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Fallback/Error</p>
                    <Avatar className="size-16">
                        <AvatarImage src="invalid-url-to-show-fallback" alt="Fallback User" />
                        <AvatarFallback className="text-xl">FU</AvatarFallback>
                    </Avatar>
                </div>
                
            </div>
        </div>
    );
}

// Export the individual components as named exports
export { Avatar, AvatarImage, AvatarFallback };
