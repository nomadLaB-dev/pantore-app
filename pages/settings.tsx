import { useState } from 'react'
import type { GetServerSideProps, NextPage } from 'next'
import type { ReactElement } from 'react'
import { createClient } from '@/lib/supabase/server-pages'
import TenantForm from '@/components/settings/TenantForm'
import BranchManagement from '@/components/settings/BranchManagement'
import AssetExport from '@/components/settings/AssetExport'
import SpecimenSettings from '@/components/settings/SpecimenSettings'
import PrivateLayout from '@/components/private-layout'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

type Props = {
  tenant: any
  branches: any[]
}

type Tab = 'erp' | 'specimen'

const SettingsPage: NextPage<Props> & { getLayout: (page: ReactElement) => ReactElement } = ({ tenant, branches }) => {
  const [activeTab, setActiveTab] = useState<Tab>('erp')
  const specimenRole = useAppStore((s) => s.specimenRole)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">設定</h1>
          <p className="text-muted-foreground text-sm">テナント情報・マスタデータなど管理者設定を行います。</p>
        </div>

        {/* タブ切り替え */}
        {specimenRole === 'admin' && (
          <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit shrink-0">
            <button
              onClick={() => setActiveTab('erp')}
              className={cn(
                'px-5 py-2 text-sm font-medium rounded-lg transition-all',
                activeTab === 'erp'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              ERP設定
            </button>
            <button
              onClick={() => setActiveTab('specimen')}
              className={cn(
                'px-5 py-2 text-sm font-medium rounded-lg transition-all',
                activeTab === 'specimen'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              検体管理設定
            </button>
          </div>
        )}
      </div>

      {/* ERP設定タブ */}
      {activeTab === 'erp' && (
        <div className="space-y-8">
          <TenantForm initialData={tenant} />
          <BranchManagement initialBranches={branches} />
          <AssetExport />
        </div>
      )}

      {/* 検体管理設定タブ（adminのみ） */}
      {activeTab === 'specimen' && specimenRole === 'admin' && (
        <SpecimenSettings />
      )}
    </div>
  )
}

SettingsPage.getLayout = function getLayout(page: ReactElement) {
  return <PrivateLayout>{page}</PrivateLayout>
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const supabase = createClient(context.req as any, context.res as any)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  let tenant = null
  let branches: any[] = []

  const { data: employee } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (employee?.tenant_id) {
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', employee.tenant_id)
      .maybeSingle()
    tenant = tenantData

    const { data: branchData } = await supabase
      .from('branches')
      .select('*')
      .order('created_at', { ascending: true })
    branches = branchData || []
  }

  return {
    props: {
      tenant: tenant ? JSON.parse(JSON.stringify(tenant)) : null,
      branches: JSON.parse(JSON.stringify(branches)),
    },
  }
}

export default SettingsPage
