import React from "react";
import { TenantSwitcher } from "@/components/TenantSwitcher";
import AdminLayoutClient from "./AdminLayoutClient";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminLayoutClient tenantSwitcher={<TenantSwitcher />}>
      {children}
    </AdminLayoutClient>
  );
}