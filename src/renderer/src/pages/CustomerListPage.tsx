import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigation } from '@/stores/navigation'
import { useCustomerStore } from '@/stores/customers'
import type { Customer } from '@/types/models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

interface CustomerFormData {
  name: string
  phone: string
  address: string
}

const emptyForm: CustomerFormData = { name: '', phone: '', address: '' }

export function CustomerListPage() {
  const { navigate } = useNavigation()
  const { customers, loading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } =
    useCustomerStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState<CustomerFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [jobCounts, setJobCounts] = useState<Record<number, number>>({})

  useEffect(() => {
    fetchCustomers().catch(() => {
      toast.error('Failed to load customers')
    })
  }, [fetchCustomers])

  useEffect(() => {
    async function loadJobCounts() {
      const counts: Record<number, number> = {}
      for (const customer of customers) {
        try {
          const jobs = await window.api.jobs.list({ customerId: customer.id })
          counts[customer.id] = jobs.length
        } catch {
          counts[customer.id] = 0
        }
      }
      setJobCounts(counts)
    }
    if (customers.length > 0) {
      loadJobCounts()
    }
  }, [customers])

  function openAddDialog() {
    setEditingCustomer(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(customer: Customer) {
    setEditingCustomer(customer)
    setForm({
      name: customer.name,
      phone: customer.phone ?? '',
      address: customer.address ?? ''
    })
    setDialogOpen(true)
  }

  function openDeleteConfirm(customer: Customer) {
    setDeleteTarget(customer)
    setConfirmOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Customer name is required')
      return
    }

    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null
      }

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data)
        toast.success('Customer updated successfully')
      } else {
        await createCustomer(data)
        toast.success('Customer created successfully')
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteCustomer(deleteTarget.id)
      toast.success('Customer deleted successfully')
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete customer')
    }
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer directory.</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus />
          Add Customer
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">No customers yet. Add your first customer to get started.</p>
          <Button onClick={openAddDialog}>
            <Plus />
            Add First Customer
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Total Jobs</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <button
                    className="font-medium text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
                    onClick={() => navigate('jobs', { customerId: customer.id })}
                  >
                    {customer.name}
                  </button>
                </TableCell>
                <TableCell>{customer.phone ?? '-'}</TableCell>
                <TableCell className="text-right">{jobCounts[customer.id] ?? 0}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEditDialog(customer)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openDeleteConfirm(customer)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name *</Label>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Address</Label>
              <Input
                id="customer-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
