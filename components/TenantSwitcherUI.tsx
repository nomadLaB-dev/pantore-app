'use client';

import { useState, useTransition, useEffect } from 'react';
import { switchTenant } from '@/app/actions/auth';
import { ChevronsUpDown, Check } from 'lucide-react';

type Tenant = {
  id: string;
  name: string;
};

export function TenantSwitcherUI({
  tenants,
  activeTenant,
  shouldSetCookie = false,
}: {
  tenants: Tenant[];
  activeTenant: Tenant;
  shouldSetCookie?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (shouldSetCookie) {
      startTransition(() => {
        switchTenant(activeTenant.id);
      });
    }
  }, [shouldSetCookie, activeTenant.id]);

  const handleSwitch = (tenantId: string) => {
    startTransition(() => {
      switchTenant(tenantId);
    });
  };

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-left text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <span className="truncate">{activeTenant.name}</span>
        <ChevronsUpDown
          className="w-4 h-4 ml-2 text-gray-400"
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <ul className="py-1">
            {tenants.map((tenant) => (
              <li key={tenant.id}>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleSwitch(tenant.id);
                  }}
                  disabled={isPending}
                  className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <span className="flex-1 truncate">{tenant.name}</span>
                  {tenant.id === activeTenant.id && (
                    <Check className="w-4 h-4 ml-3" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
