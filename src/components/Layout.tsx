
import { ReactNode } from "react";

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/90">
      <main className="container mx-auto py-8 px-4">
        <div className="glass-morphism rounded-lg p-6 shadow-xl">
          {children}
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>JSX to TSX Converter &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};
