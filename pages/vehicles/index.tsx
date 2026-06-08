import type { GetServerSideProps, NextPage } from 'next'
import type { ReactElement } from 'react'
import { createClient } from '@/lib/supabase/server-pages'
import { VehiclesClient } from '@/components/vehicles-client'
import PrivateLayout from '@/components/private-layout'

type Stats = {
  totalVehiclesCount: number
  activeCount: number
  inRepairCount: number
  notAppliedCount: number
}

type Props = {
  vehicles: any[]
  branches: any[]
  stats: Stats
}

const VehiclesPage: NextPage<Props> & { getLayout: (page: ReactElement) => ReactElement } = ({ vehicles, branches, stats }) => {
  return <VehiclesClient vehicles={vehicles} branches={branches} stats={stats} />
}

VehiclesPage.getLayout = function getLayout(page: ReactElement) {
  return <PrivateLayout>{page}</PrivateLayout>
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const supabase = createClient(context.req as any, context.res as any)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const [branchesRes, vehiclesRes] = await Promise.all([
    supabase.from('branches').select('*').order('name'),
    supabase.from('vehicles').select(`
      *,
      branch:branches(*),
      lease:vehicle_leases(*),
      purchase:vehicle_purchases(*),
      inspections:vehicle_inspection(*)
    `).order('created_at', { ascending: false }),
  ])

  const branches = branchesRes.data || []

  const vehicles = (vehiclesRes.data || []).map((vehicle: any) => ({
    id: vehicle.id,
    manufacturer: vehicle.manufacturer,
    model: vehicle.model,
    licensePlate: vehicle.license_plate,
    licensePlateColor: vehicle.license_plate_color,
    ownershipType: vehicle.ownership_type,
    branchId: vehicle.branch_id,
    tireType: vehicle.tire_type,
    isTransportBureauApplied: vehicle.is_transport_bureau_applied,
    branch: vehicle.branch ? { id: vehicle.branch.id, name: vehicle.branch.name } : null,
    lease: vehicle.lease ? {
      leaseCompany: vehicle.lease.lease_company,
      contractStartDate: vehicle.lease.contract_start_date,
      contractEndDate: vehicle.lease.contract_end_date,
      monthlyFee: vehicle.lease.monthly_fee,
    } : null,
    purchase: vehicle.purchase ? {
      acquisitionCost: vehicle.purchase.acquisition_cost,
      purchaseDate: vehicle.purchase.purchase_date,
      firstRegistrationDate: vehicle.purchase.first_registration_date,
      bodyType: vehicle.purchase.body_type,
      isNewCar: vehicle.purchase.is_new_car,
      method: vehicle.purchase.method,
    } : null,
    insurances: [],
    accidents: [],
    inspections: Array.isArray(vehicle.inspections) ? vehicle.inspections.map((insp: any) => ({
      id: insp.id,
      accidentsId: insp.accidents_id,
      inspectionType: insp.inspection_type,
      inspectionStartDate: insp.inspection_start_date,
      inspectionEndDate: insp.inspection_end_date,
      inspectionCost: insp.inspection_cost,
      nextInspectionMileage: insp.next_inspection_mileage,
      nextInspectionDate: insp.next_inspection_date,
      notes: insp.notes,
    })) : [],
    createdAt: vehicle.created_at,
    updatedAt: vehicle.updated_at,
  }))

  const today = new Date()
  const todayStr = new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
  const totalVehiclesCount = vehicles.length
  const inRepairCount = vehicles.filter((v: any) =>
    v.inspections.some((insp: any) =>
      insp.inspectionStartDate && insp.inspectionStartDate <= todayStr &&
      insp.inspectionEndDate && insp.inspectionEndDate >= todayStr
    )
  ).length
  const activeCount = totalVehiclesCount - inRepairCount
  const notAppliedCount = vehicles.filter((v: any) => v.isTransportBureauApplied === false).length

  return {
    props: {
      vehicles: JSON.parse(JSON.stringify(vehicles)),
      branches: JSON.parse(JSON.stringify(branches)),
      stats: { totalVehiclesCount, activeCount, inRepairCount, notAppliedCount },
    },
  }
}

export default VehiclesPage
