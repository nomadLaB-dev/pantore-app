import type { GetServerSideProps, NextPage } from 'next'
import type { ReactElement } from 'react'
import { createClient } from '@/lib/supabase/server-pages'
import TenantForm from '@/components/settings/TenantForm'
import BranchManagement from '@/components/settings/BranchManagement'
import AssetExport from '@/components/settings/AssetExport'
import PrivateLayout from '@/components/private-layout'

type Props = {
  tenant: any
  branches: any[]
}

const SettingsPage: NextPage<Props> & { getLayout: (page: ReactElement) => ReactElement } = ({ tenant, branches }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">設定</h1>
        <p className="text-muted-foreground text-sm">テナント情報・エクスポートなど管理者設定を行います。</p>
      </div>

      <TenantForm initialData={tenant} />
      <BranchManagement initialBranches={branches} />
      <AssetExport />
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
    .from('employees')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (employee?.tenant_id) {
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', employee.tenant_id)
      .single()
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
