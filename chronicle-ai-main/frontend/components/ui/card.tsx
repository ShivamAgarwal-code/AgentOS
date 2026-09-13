import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
}

export function Card({ className = "", id, ...props }: CardProps) {
  return (
    <div
      id={id}
      className={`rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-zinc-50 shadow-sm backdrop-blur-sm transition-colors hover:border-zinc-700/80 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", id, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div id={id} className={`flex flex-col space-y-1.5 pb-4 ${className}`} {...props} />;
}

export function CardTitle({ className = "", id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 id={id} className={`font-sans text-lg font-medium leading-none tracking-tight text-zinc-100 ${className}`} {...props} />;
}

export function CardDescription({ className = "", id, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p id={id} className={`text-sm text-zinc-400 font-sans ${className}`} {...props} />;
}

export function CardContent({ className = "", id, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div id={id} className={`pt-0 ${className}`} {...props} />;
}

export function CardFooter({ className = "", id, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div id={id} className={`flex items-center pt-4 border-t border-zinc-800/60 mt-4 ${className}`} {...props} />;
}
