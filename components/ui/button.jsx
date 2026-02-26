import * as React from 'react'

// --- Mocks for External Dependencies (Required for a runnable single file) ---

// 1. Mock for '@/lib/utils' cn function (classnames)
const cn = (...inputs) => inputs.filter(Boolean).flat().join(' ');

// 2. Mock for Radix Slot
const Slot = ({ children, ...props }) => {
  if (React.isValidElement(children)) {
    // Merge props into the single child element
    return React.cloneElement(children, {
      ...props,
      ...children.props,
      className: cn(children.props.className, props.className)
    });
  }
  return children;
};

// 3. Mock for 'class-variance-authority' cva function (Class Variance Authority)
const cva = (base, { variants, defaultVariants }) => (options = {}) => {
  const { variant, size, className } = options;
  const v = variant || defaultVariants.variant;
  const s = size || defaultVariants.size;

  let classes = base;

  if (variants.variant && variants.variant[v]) {
    classes = cn(classes, variants.variant[v]);
  }
  if (variants.size && variants.size[s]) {
    classes = cn(classes, variants.size[s]);
  }
  if (className) {
    classes = cn(classes, className);
  }
  
  return classes;
};


// --- Button Component Logic ---

// Defined using the cva mock, mapping utility colors (primary, ring, destructive, etc.)
// to standard Tailwind classes for a runnable example.
const buttonVariants = cva(
  // Base Classes
  // focus-visible:border-ring -> focus-visible:border-blue-500, focus-visible:ring-ring -> focus-visible:ring-blue-500
  // aria-invalid:border-destructive -> aria-invalid:border-red-500
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-blue-500 focus-visible:ring-blue-500/50 focus-visible:ring-[3px] aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500",
  {
    variants: {
      variant: {
        // primary -> blue-600, primary-foreground -> white
        default:
          'bg-blue-600 text-white shadow-sm hover:bg-blue-700/90',
        // destructive -> red-600
        destructive:
          'bg-red-600 text-white shadow-sm hover:bg-red-700/90 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40 dark:bg-red-600/60',
        // background -> white/gray, input -> gray
        outline:
          'border border-gray-300 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-700/30 dark:border-gray-600 dark:hover:bg-gray-700/50',
        // secondary -> gray-200, secondary-foreground -> gray-800
        secondary:
          'bg-gray-200 text-gray-800 shadow-sm hover:bg-gray-300/80',
        // accent -> gray-100
        ghost:
          'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700/50',
        // primary -> blue-600
        link: 'text-blue-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9 p-0', 
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

// Button component without TypeScript types
const Button = React.forwardRef(({
  className,
  variant,
  size,
  asChild = false,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})

Button.displayName = 'Button'

// Mocking icons for the demonstration
const Send = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 19-2-8-8-2 19-7z"/></svg>;
const Trash = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M14 2h-4c-1.5 0-2 1-2 2v2"/></svg>;

// --- Demonstration Component ---
export default function ButtonDemo() {
  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-3xl font-bold text-gray-800">Button Variants & Sizes (JSX Conversion)</h1>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Default (Primary)</h2>
        <div className="flex flex-wrap items-end gap-3 p-4 bg-white rounded-xl shadow-lg">
          <Button>Default</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
          <Button>
            <Send /> Send Message
          </Button>
          <Button size="icon" aria-label="Send">
            <Send />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Outline & Destructive</h2>
        <div className="flex flex-wrap items-end gap-3 p-4 bg-white rounded-xl shadow-lg">
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Delete Account</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="link">Link Button</Button>
        </div>
      </div>

       <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">As Child Example</h2>
        <div className="flex flex-wrap items-end gap-3 p-4 bg-white rounded-xl shadow-lg">
          <Button asChild variant="outline" size="lg">
            <a href="#link-target" className="text-blue-600">
              Go to Settings
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

export { Button, buttonVariants }
