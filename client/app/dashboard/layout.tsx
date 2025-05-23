import type React from "react";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { BalloonBackground } from "@/components/festive-elements";
import { UserProvider } from "@/hooks/use-user-context";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <BalloonBackground>
        <div className="flex min-h-screen flex-col">
          <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex h-16 items-center px-4">
              <div className="flex items-center">
                <div className="flex items-center">
                  <Image
                    src="/logos/logo-icon.png"
                    alt="EmbalaFest Logo"
                    width={32}
                    height={32}
                    className="h-8 w-8"
                  />
                  <span className="ml-2 font-bold text-lg text-primary hidden sm:inline">
                    Embalagens & Festas
                  </span>
                  <span className="ml-2 font-bold text-lg text-primary sm:hidden">
                    EF
                  </span>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <MainNav />
              </div>
              <div className="flex items-center">
                <UserNav />
              </div>
            </div>
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </BalloonBackground>
    </UserProvider>
  );
}
