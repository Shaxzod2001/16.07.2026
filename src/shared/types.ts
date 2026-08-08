export interface Customer {
  id: number
  name: string
  phone: string | null
  email: string | null
  company: string | null
  notes: string | null
  created_at: string
}

export type NewCustomer = Omit<Customer, 'id' | 'created_at'>
