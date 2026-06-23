import type { GetServerSideProps, NextPage } from 'next'
import type { ReactElement } from 'react'
import { createClient } from '@/lib/supabase/server-pages'
import { VehicleDetailClient } from '@/components/vehicle-detail-client'
import PrivateLayout from '@/components/private-layout'

type Props = {
  vehicle: any
}

const VehicleDetailPage: NextPage<Props> & { getLayout: (page: ReactElement) => ReactElement } = ({ vehicle }) => {
  return <VehicleDetailClient vehicle={vehicle} />
}

VehicleDetailPage.getLayout = function getLayout(page: ReactElement) {
  return <PrivateLayout>{page}</PrivateLayout>
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const id = context.params?.id as string
  const supabase = createClient(context.req as any, context.res as any)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const { data: vehicleResponse, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      branch:branches(*),
      lease:vehicle_leases(*),
      purchase:vehicle_purchases(*),
      insurances:vehicle_insurances(*),
      accidents:vehicle_accidents(*),
      mileages:vehicle_mileage(*),
      inspections:vehicle_inspection(*)
    `)
    .eq('id', id)
    .single()

  if (error || !vehicleResponse) {
    return { notFound: true }
  }

  const vehicle = {
    id: vehicleResponse.id,
    manufacturer: vehicleResponse.manufacturer,
    model: vehicleResponse.model,
    licensePlate: vehicleResponse.license_plate,
    licensePlateColor: vehicleResponse.license_plate_color,
    ownershipType: vehicleResponse.ownership_type,
    branchId: vehicleResponse.branch_id,
    tireType: vehicleResponse.tire_type,
    isTransportBureauApplied: vehicleResponse.is_transport_bureau_applied,
    branch: vehicleResponse.branch ? { id: vehicleResponse.branch.id, name: vehicleResponse.branch.name } : null,
    lease: vehicleResponse.lease ? {
      leaseCompany: vehicleResponse.lease.lease_company,
      contractStartDate: vehicleResponse.lease.contract_start_date,
      contractEndDate: vehicleResponse.lease.contract_end_date,
      monthlyFee: vehicleResponse.lease.monthly_fee,
    } : null,
    purchase: vehicleResponse.purchase ? {
      acquisitionCost: vehicleResponse.purchase.acquisition_cost,
      bodyType: vehicleResponse.purchase.body_type,
      isNewCar: vehicleResponse.purchase.is_new_car,
      method: vehicleResponse.purchase.method,
      purchaseDate: vehicleResponse.purchase.purchase_date,
      firstRegistrationDate: vehicleResponse.purchase.first_registration_date,
      updatedAt: vehicleResponse.purchase.updated_at,
    } : null,
    insurances: (vehicleResponse.insurances || []).map((ins: any) => ({
      id: ins.id,
      companyName: ins.company_name,
      type: ins.type,
      startDate: ins.start_date,
      endDate: ins.end_date,
      premiumAmount: ins.premium_amount,
      coverageDetails: ins.coverage_details,
    })).sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()),
    accidents: (vehicleResponse.accidents || []).map((acc: any) => ({
      id: acc.id,
      accidentDate: acc.accident_date,
      description: acc.description,
      severity: acc.severity,
      repairCost: acc.repair_cost,
      isBodilyInjury: acc.is_bodily_injury,
      isPropertyDamage: acc.is_property_damage,
    })).sort((a: any, b: any) => new Date(b.accidentDate).getTime() - new Date(a.accidentDate).getTime()),
    mileages: (vehicleResponse.mileages || []).map((m: any) => ({
      id: m.id,
      recordDate: m.record_date,
      mileage: m.mileage,
    })).sort((a: any, b: any) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()),
    inspections: (vehicleResponse.inspections || []).map((insp: any) => ({
      id: insp.id,
      accidentsId: insp.accidents_id,
      inspectionType: insp.inspection_type,
      inspectionStartDate: insp.inspection_start_date,
      inspectionEndDate: insp.inspection_end_date,
      inspectionCost: insp.inspection_cost,
      nextInspectionMileage: insp.next_inspection_mileage,
      nextInspectionDate: insp.next_inspection_date,
      notes: insp.notes,
    })).sort((a: any, b: any) => new Date(b.inspectionStartDate).getTime() - new Date(a.inspectionStartDate).getTime()),
    createdAt: vehicleResponse.created_at,
    updatedAt: vehicleResponse.updated_at,
  }

  return {
    props: { vehicle: JSON.parse(JSON.stringify(vehicle)) },
  }
}

export default VehicleDetailPage
