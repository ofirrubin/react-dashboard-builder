// Fix Preact/React JSX mismatch for DashboardToolbar and UI components when compiling with tsup
declare namespace preact {
    type ComponentType<P = any> = any;
}
declare namespace preact.JSXInternal {
    interface IntrinsicElements {
        [elemName: string]: any;
    }
}
declare namespace React {
    type ReactNode = any;
    type ComponentType<P = any> = any;
}
