import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Plus,
  PlusCircle
} from 'lucide-react'

import { useNavigation } from '@/stores/navigation'
import { useCustomerStore } from '@/stores/customers'
import { useItemStore } from '@/stores/items'
import { useJobStore } from '@/stores/jobs'
import { useMachineStore } from '@/stores/machines'

import { useJobCostCalculator, type JobFormCostData } from '@/hooks/useJobCostCalculator'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'

import { MachineEntryCard, type MachineEntryData } from '@/components/job/MachineEntryCard'
import { CostSummary } from '@/components/job/CostSummary'
import { AutoFillSuggestion } from '@/components/job/AutoFillSuggestion'

// ---------- Types ----------

interface FormState {
  date: Date
  customerId: number | null
  itemId: number | null
  categoryId: number | null
  quantity: number
  rate: number
  wastePercentage: number
  cooly: number
  machineEntries: MachineEntryData[]
  notes: string
  status: string
}

const DEFAULT_FORM: FormState = {
  date: new Date(),
  customerId: null,
  itemId: null,
  categoryId: null,
  quantity: 0,
  rate: 0,
  wastePercentage: 0,
  cooly: 0,
  machineEntries: [],
  notes: '',
  status: 'pending'
}

// ---------- Component ----------

export function JobFormPage() {
  const { pageParams, navigate } = useNavigation()
  const jobId = pageParams.jobId as number | undefined
  const isEditMode = jobId != null

  // Stores
  const { customers, fetchCustomers, createCustomer } = useCustomerStore()
  const { items, categories, fetchItems, fetchCategories, getItemsByCategory } = useItemStore()
  const { createJob, updateJob } = useJobStore()
  const { machines, fetchMachines } = useMachineStore()

  // Form state
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

  // Auto-fill state
  const [autoFillJobNumber, setAutoFillJobNumber] = useState<string | null>(null)

  // Customer quick-add dialog
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  // Combobox open state
  const [customerComboOpen, setCustomerComboOpen] = useState(false)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)

  // Load reference data
  useEffect(() => {
    fetchCustomers()
    fetchItems()
    fetchCategories()
    fetchMachines()
  }, [fetchCustomers, fetchItems, fetchCategories, fetchMachines])

  // Load existing job if editing
  useEffect(() => {
    if (!isEditMode || !jobId) return

    async function loadJob() {
      try {
        const job = await window.api.jobs.getById(jobId!)
        if (!job) return

        // Find category from item
        const item = items.find((i) => i.id === job.itemId)

        setForm({
          date: new Date(job.date),
          customerId: job.customerId,
          itemId: job.itemId,
          categoryId: item?.categoryId ?? null,
          quantity: job.quantity,
          rate: job.rate,
          wastePercentage: job.wastePercentage,
          cooly: job.cooly,
          notes: job.notes ?? '',
          status: job.status,
          machineEntries: []
        })

        // Load machine entries
        const entries = await window.api.jobs.getMachineEntries(jobId!)
        if (entries && entries.length > 0) {
          setForm((prev) => ({
            ...prev,
            machineEntries: entries.map((e: { machineTypeId: number; machineCustomData: string; cost: number; wastePercentage: number; wasteAmount: number }) => ({
              machineTypeId: e.machineTypeId,
              machineCustomData: JSON.parse(e.machineCustomData || '{}'),
              cost: e.cost,
              wastePercentage: e.wastePercentage,
              wasteAmount: e.wasteAmount
            }))
          }))
        }
      } catch (err) {
        toast.error('Failed to load job data')
        console.error(err)
      }
    }

    if (items.length > 0) {
      loadJob()
    }
  }, [isEditMode, jobId, items])

  // Auto-fill when customer + item are both selected
  useEffect(() => {
    if (!form.customerId || !form.itemId || isEditMode) return

    async function tryAutoFill() {
      try {
        const result = await window.api.jobs.getByCustomerItem(form.customerId!, form.itemId!)
        if (result) {
          setForm((prev) => ({
            ...prev,
            quantity: result.quantity ?? prev.quantity,
            rate: result.rate ?? prev.rate,
            wastePercentage: result.wastePercentage ?? prev.wastePercentage,
            cooly: result.cooly ?? prev.cooly,
            machineEntries: result.machineEntries
              ? result.machineEntries.map((e: { machineTypeId: number; machineCustomData: string; cost: number; wastePercentage: number; wasteAmount: number }) => ({
                  machineTypeId: e.machineTypeId,
                  machineCustomData: JSON.parse(
                    typeof e.machineCustomData === 'string' ? e.machineCustomData : '{}'
                  ),
                  cost: e.cost,
                  wastePercentage: e.wastePercentage,
                  wasteAmount: e.wasteAmount
                }))
              : prev.machineEntries
          }))
          setAutoFillJobNumber(result.jobNumber ?? null)
        }
      } catch {
        // No auto-fill data available, that's fine
      }
    }

    tryAutoFill()
  }, [form.customerId, form.itemId, isEditMode])

  // Derived data
  const selectedCustomer = customers.find((c) => c.id === form.customerId)
  const filteredItems = form.categoryId ? getItemsByCategory(form.categoryId) : items
  const selectedItem = items.find((i) => i.id === form.itemId)
  const baseAmount = form.quantity * form.rate
  const wasteAmount = baseAmount * (form.wastePercentage / 100)

  // Cost calculator
  const costData: JobFormCostData = {
    quantity: form.quantity,
    rate: form.rate,
    wastePercentage: form.wastePercentage,
    cooly: form.cooly,
    machineEntries: form.machineEntries
  }
  const costBreakdown = useJobCostCalculator(costData, machines)

  // Handlers
  const updateForm = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleCategoryChange = (categoryId: string) => {
    const id = Number(categoryId)
    setForm((prev) => ({ ...prev, categoryId: id, itemId: null }))
  }

  const handleItemChange = (itemId: string) => {
    updateForm('itemId', Number(itemId))
  }

  const handleAddMachine = (machineTypeId: number) => {
    const newEntry: MachineEntryData = {
      machineTypeId,
      machineCustomData: {},
      cost: 0,
      wastePercentage: 0,
      wasteAmount: 0
    }
    setForm((prev) => ({
      ...prev,
      machineEntries: [...prev.machineEntries, newEntry]
    }))
  }

  const handleMachineEntryChange = (index: number, updated: MachineEntryData) => {
    setForm((prev) => ({
      ...prev,
      machineEntries: prev.machineEntries.map((e, i) => (i === index ? updated : e))
    }))
  }

  const handleRemoveMachineEntry = (index: number) => {
    setForm((prev) => ({
      ...prev,
      machineEntries: prev.machineEntries.filter((_, i) => i !== index)
    }))
  }

  const handleCustomerQuickAdd = async () => {
    if (!newCustomerName.trim()) return
    setCreatingCustomer(true)
    try {
      const customer = await createCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || null,
        address: null
      })
      updateForm('customerId', customer.id)
      setCustomerDialogOpen(false)
      setNewCustomerName('')
      setNewCustomerPhone('')
      toast.success(`Customer "${customer.name}" created`)
    } catch (err) {
      toast.error('Failed to create customer')
      console.error(err)
    } finally {
      setCreatingCustomer(false)
    }
  }

  const handleSave = async () => {
    // Basic validation
    if (!form.customerId) {
      toast.error('Please select a customer')
      return
    }
    if (!form.itemId) {
      toast.error('Please select an item')
      return
    }
    if (form.quantity <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }
    if (form.rate <= 0) {
      toast.error('Rate must be greater than 0')
      return
    }

    setSaving(true)
    try {
      const jobData = {
        date: format(form.date, 'yyyy-MM-dd'),
        customerId: form.customerId,
        itemId: form.itemId,
        quantity: form.quantity,
        rate: form.rate,
        amount: baseAmount,
        wastePercentage: form.wastePercentage,
        wasteAmount: wasteAmount,
        cooly: form.cooly,
        totalAmount: costBreakdown.grandTotal,
        notes: form.notes || null,
        status: form.status
      }

      const machineEntriesData = form.machineEntries.map((e) => ({
        machineTypeId: e.machineTypeId,
        machineCustomData: JSON.stringify(e.machineCustomData),
        cost: e.cost,
        wastePercentage: e.wastePercentage,
        wasteAmount: e.wasteAmount
      }))

      if (isEditMode && jobId) {
        await updateJob(jobId, jobData)
        // Update machine entries
        if (window.api.jobs.updateMachineEntries) {
          await window.api.jobs.updateMachineEntries(jobId, machineEntriesData)
        }
        toast.success('Job updated successfully')
      } else {
        const job = await createJob(jobData as any)
        // Create machine entries
        if (window.api.jobs.createMachineEntries && machineEntriesData.length > 0) {
          await window.api.jobs.createMachineEntries(job.id, machineEntriesData)
        }
        toast.success(`Job ${job.jobNumber} created successfully`)
      }

      navigate('jobs')
    } catch (err) {
      toast.error(isEditMode ? 'Failed to update job' : 'Failed to create job')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('jobs')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          {isEditMode ? 'Edit Job' : 'New Job'}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode
            ? `Editing job #${jobId}. Update job details and machine entries.`
            : 'Create a new production job with costing details.'}
        </p>
      </div>

      {/* Auto-fill Banner */}
      {autoFillJobNumber && (
        <AutoFillSuggestion
          jobNumber={autoFillJobNumber}
          onDismiss={() => setAutoFillJobNumber(null)}
        />
      )}

      {/* Section 1 - Date & Customer */}
      <Card>
        <CardHeader>
          <CardTitle>Date & Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {form.date ? format(form.date, 'dd MMM yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date}
                    onSelect={(date) => {
                      if (date) {
                        updateForm('date', date)
                        setDatePopoverOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Customer Combobox */}
            <div className="space-y-2">
              <Label>Customer</Label>
              <Popover open={customerComboOpen} onOpenChange={setCustomerComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerComboOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedCustomer ? selectedCustomer.name : 'Select customer...'}
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customers..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.name}
                            onSelect={() => {
                              updateForm('customerId', customer.id)
                              setCustomerComboOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 size-4',
                                form.customerId === customer.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {customer.name}
                            {customer.phone && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                {customer.phone}
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setCustomerComboOpen(false)
                            setCustomerDialogOpen(true)
                          }}
                        >
                          <PlusCircle className="mr-2 size-4" />
                          Add New Customer
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 - Item Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Item Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.categoryId ? String(form.categoryId) : ''}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Item */}
            <div className="space-y-2">
              <Label>Item</Label>
              <Select
                value={form.itemId ? String(form.itemId) : ''}
                onValueChange={handleItemChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {filteredItems.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size (read-only) */}
            <div className="space-y-2">
              <Label>Size</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm">
                {selectedItem?.size || 'Select an item first'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 - Quantity, Rate & Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Quantity, Rate & Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                value={form.quantity || ''}
                onChange={(e) => updateForm('quantity', Number(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            {/* Rate */}
            <div className="space-y-2">
              <Label htmlFor="rate">Rate (per unit)</Label>
              <Input
                id="rate"
                type="number"
                min={0}
                step="0.01"
                value={form.rate || ''}
                onChange={(e) => updateForm('rate', Number(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            {/* Amount (auto-calculated) */}
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                {formatINR(baseAmount)}
              </div>
            </div>

            {/* Cooly */}
            <div className="space-y-2">
              <Label htmlFor="cooly">Cooly (Labor)</Label>
              <Input
                id="cooly"
                type="number"
                min={0}
                step="0.01"
                value={form.cooly || ''}
                onChange={(e) => updateForm('cooly', Number(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            {/* Waste % */}
            <div className="space-y-2">
              <Label htmlFor="wastePercentage">Waste %</Label>
              <Input
                id="wastePercentage"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={form.wastePercentage || ''}
                onChange={(e) => updateForm('wastePercentage', Number(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            {/* Waste Amount (auto-calculated) */}
            <div className="space-y-2">
              <Label>Waste Amount</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                {formatINR(wasteAmount)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4 - Machine Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Machine Entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.machineEntries.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No machines added yet. Click &quot;Add Machine&quot; to add a machine entry.
            </p>
          )}

          {form.machineEntries.map((entry, index) => {
            const machineType = machines.find((m) => m.id === entry.machineTypeId)
            if (!machineType) return null
            return (
              <MachineEntryCard
                key={`${entry.machineTypeId}-${index}`}
                machineType={machineType}
                entry={entry}
                onChange={(updated) => handleMachineEntryChange(index, updated)}
                onRemove={() => handleRemoveMachineEntry(index)}
              />
            )
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 size-4" />
                Add Machine
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {machines.length === 0 ? (
                <DropdownMenuItem disabled>No machine types available</DropdownMenuItem>
              ) : (
                machines.map((machine) => (
                  <DropdownMenuItem
                    key={machine.id}
                    onClick={() => handleAddMachine(machine.id)}
                  >
                    {machine.name}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      {/* Section 5 - Cost Summary */}
      <CostSummary breakdown={costBreakdown} />

      {/* Section 6 - Notes & Status */}
      <Card>
        <CardHeader>
          <CardTitle>Notes & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.notes}
                onChange={(e) => updateForm('notes', e.target.value)}
                placeholder="Optional notes about this job..."
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => updateForm('status', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : isEditMode ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Quick-Add Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Quickly add a new customer. You can update their details later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-customer-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-customer-name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Customer name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-customer-phone">Phone</Label>
              <Input
                id="new-customer-phone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="Phone number (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomerDialogOpen(false)}
              disabled={creatingCustomer}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomerQuickAdd}
              disabled={!newCustomerName.trim() || creatingCustomer}
            >
              {creatingCustomer ? 'Adding...' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
