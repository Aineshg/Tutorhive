import * as React from 'react';

// --- Utility and Icon Mocks (Replacing external imports) ---

// Utility function to mock 'cn' (class names) for merging strings
const cn = (...inputs) => inputs.filter(Boolean).flat().join(' ');

// Mocking Lucide icons
const CheckIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const ChevronRightIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const CircleIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>;

// --- Radix Primitives Mocks (Simplified Functional Components) ---
// These mocks simplify Radix's complex state management and positioning for a runnable demo.

const DropdownMenuPrimitive = {
  // Base Mocks
  Root: ({ children, ...props }) => <div className="relative inline-block" {...props}>{children}</div>,
  Portal: ({ children }) => children, // Render children directly in place
  Trigger: ({ children, ...props }) => {
    // DropdownMenuTrigger usually wraps a button. We'll ensure the onClick prop is respected.
    const child = React.Children.only(children);
    return React.cloneElement(child, props);
  },

  // Content Mocks
  Content: (props) => <div {...props} />,
  Group: (props) => <div {...props} />,
  Item: (props) => <div {...props} />,
  Label: (props) => <div {...props} />,
  Separator: (props) => <div {...props} />,

  // Checkbox/Radio Mocks
  CheckboxItem: (props) => <div role="menuitemcheckbox" {...props} />,
  RadioGroup: (props) => <div role="radiogroup" {...props} />,
  RadioItem: (props) => <div role="menuitemradio" {...props} />,
  ItemIndicator: (props) => <span {...props} />,

  // Sub Menu Mocks
  Sub: (props) => <div {...props} />,
  SubTrigger: (props) => <div {...props} />,
  SubContent: (props) => <div {...props} />,
};

// --- Converted Dropdown Menu Components (from TypeScript to JSX) ---

function DropdownMenu(props) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal(props) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

function DropdownMenuTrigger({ children, onClick, asChild, ...props }) {
  // Ensure the trigger element is clickable. In this mock, we pass onClick down.
  if (asChild) {
    const child = React.Children.only(children);
    return React.cloneElement(child, { 
      ...props,
      onClick: (e) => {
        if (onClick) onClick(e);
        if (child.props.onClick) child.props.onClick(e);
      }
    });
  }
  const child = React.Children.only(children);
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    >
      {React.cloneElement(child, { onClick })}
    </DropdownMenuPrimitive.Trigger>
  );
}

// NOTE: This component needs manual visibility logic in the App for the demo.
function DropdownMenuContent({
  className,
  sideOffset = 4,
  align = 'start',
  isOpen, // Added for demo
  onClose, // Added for demo
  ...props
}) {
  if (!isOpen) return null; // Manual rendering logic for the demo

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        style={{ background: 'transparent' }}
      />
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        onClick={(e) => e.stopPropagation()}
        // Radix props: sideOffset={sideOffset} origin will be ignored for demo
        className={cn(
          'absolute bg-white text-gray-900 z-50 min-w-[12rem] rounded-xl border p-1 shadow-lg backdrop-blur-md',
          align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0',
          'mt-2 top-full',
          // Replaced complex data-[state] animations with simple visibility/positioning
          className,
        )}
        {...props}
      />
    </>
  );
}

function DropdownMenuGroup(props) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  // Removed onClick from props destructuring to allow it to be passed through
  ...props
}) {
  const variantClasses = {
    default: 'focus:bg-gray-100 focus:text-gray-900',
    destructive: 'text-red-600 focus:bg-red-50 focus:text-red-700',
  };

  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        // Base styling for all items
        'relative flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*=\'size-\'])]:size-4',
        // Dynamic classes based on variant/state
        variantClasses[variant],
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        'focus:bg-gray-100 focus:text-gray-900 relative flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-2 pl-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*=\'size-\'])]:size-4',
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          {checked && <CheckIcon className="size-4 text-blue-600" />}
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup(props) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  checked, // Added checked for demo purposes
  ...props
}) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        'focus:bg-gray-100 focus:text-gray-900 relative flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-2 pl-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*=\'size-\'])]:size-4',
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          {checked && <CircleIcon className="size-2 fill-blue-600" />}
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        'px-3 py-1.5 text-sm font-semibold text-gray-500',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('bg-gray-200 -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        'text-gray-400 ml-auto text-xs tracking-widest',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub(props) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        'focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm outline-none select-none',
        inset && 'pl-8',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      // Simplified Radix classes for basic demo styling
      className={cn(
        'bg-white text-gray-900 z-50 min-w-[8rem] rounded-md border p-1 shadow-lg absolute left-full top-0 ml-1',
        className,
      )}
      {...props}
    />
  );
}

// --- Demo App Component ---

export default function App() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [checked, setChecked] = React.useState(true);
  const [radioValue, setRadioValue] = React.useState('bottom');

  const handleTriggerClick = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className="p-8 font-sans bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dropdown Menu (Radix to JSX Conversion)</h1>
      <p className="text-gray-600 mb-8">Click the button below to interact with the mock component.</p>
      
      <div className="p-6 border rounded-xl bg-white shadow-md">
        <DropdownMenu>
          <DropdownMenuTrigger onClick={handleTriggerClick}>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
              Open Menu
            </button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent isOpen={isOpen} className="w-64">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setIsOpen(false)}>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsOpen(false)}>
                Billing
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </DropdownMenuItem>
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Invite users
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Email</DropdownMenuItem>
                    <DropdownMenuItem>Message</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>More...</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              
              <DropdownMenuItem onClick={() => setIsOpen(false)}>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />

            <DropdownMenuCheckboxItem
              checked={checked}
              onClick={() => setChecked(prev => !prev)}
            >
              Show Sidebar
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuSeparator />

            <DropdownMenuLabel inset>Panel Position</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={radioValue} onValueChange={setRadioValue}>
              {['top', 'bottom', 'left', 'right'].map((pos) => (
                <DropdownMenuRadioItem key={pos} value={pos} checked={radioValue === pos} onClick={() => setRadioValue(pos)}>
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem variant="destructive" onClick={() => setIsOpen(false)}>
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Export the individual components as named exports
export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
