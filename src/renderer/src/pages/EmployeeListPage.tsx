import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useEmployeeStore } from '@/stores/employees'
import { useMachineStore } from '@/stores/machines'
import type { Employee } from '@/types/models'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

interface EmployeeFormData {
  name: string
  phone: string
  machineTypeId: string
}

const emptyForm: EmployeeFormData = { name: '', phone: '', machineTypeId: '' }

export function EmployeeListPage() {
  const { employees, loading, fetchEmployees, createEmployee, updateEmployee, deleteEmployee } =
    useEmployeeStore()
  const { machines, fetchMachines } = useMachineStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [form, setForm] = useState<EmployeeFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    fetchEmployees().catch(() => {
      toast.error('Failed to load employees')
    })
    fetchMachines()
  }, [fetchEmployees, fetchMachines])

  function openAddDialog() {
    setEditingEmployee(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(employee: Employee) {
    setEditingEmployee(employee)
    setForm({
      name: employee.name,
      phone: employee.phone ?? '',
      machineTypeId: String(employee.machineTypeId)
    })
    setDialogOpen(true)
  }

  function openDeleteConfirm(employee: Employee) {
    setDeleteTarget(employee)
    setConfirmOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Employee name is required')
      return
    }
    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        machineTypeId: form.machineTypeId ? Number(form.machineTypeId) : null
      }

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, data)
        toast.success('Employee updated successfully')
      } else {
        await createEmployee(data)
        toast.success('Employee created successfully')
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save employee')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteEmployee(deleteTarget.id)
      toast.success('Employee deleted successfully')
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete employee')
    }
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-muted-foreground">Manage your employee directory.</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus />
          Add Employee
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">No employees yet. Add your first employee to get started.</p>
          <Button onClick={openAddDialog}>
            <Plus />
            Add First Employee
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Machine Type</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.phone ?? '-'}</TableCell>
                <TableCell>{employee.machineTypeName ?? '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Edit ${employee.name}`}
                      onClick={() => openEditDialog(employee)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Delete ${employee.name}`}
                      onClick={() => openDeleteConfirm(employee)}
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
            <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee-name">Name *</Label>
              <Input
                id="employee-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Employee name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-phone">Phone</Label>
              <Input
                id="employee-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label>Machine Type</Label>
              <Select
                value={form.machineTypeId}
                onValueChange={(val) => setForm({ ...form, machineTypeId: val === 'none' ? '' : val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select machine type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={String(machine.id)}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        title="Delete Employee"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
