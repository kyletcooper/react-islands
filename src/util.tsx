import { FC, useEffect, useRef } from "react";

/**
 * Internal component for rendering raw HTML in a React component.
 */
export function RawHTML({ html }: { html: string }) {
	const ref = useRef<HTMLScriptElement>(null);

	// important to not have ANY deps
	useEffect(() => {
		if (ref.current) {
			ref.current.outerHTML = html;
		}
	}, []);

	return <script ref={ref} />;
}

/**
 * Create a higher-order component with certain fixed.
 *
 * Useful for quickly creating multiple variants of the same component to use as islands.
 *
 * @param component FC<T>
 * @param setProps Partial<T>
 * @returns FC<T>
 */
export function withProps<T>(component: FC<T>, setProps: Partial<T>): FC<T> {
	return (props: T) => {
		return component({ ...props, ...setProps });
	};
}

/**
 * Checks if the current script is running in a pre-render.
 *
 * @returns boolean
 */
export function isServer(): boolean {
	return !(typeof window != "undefined" && window.document);
}
