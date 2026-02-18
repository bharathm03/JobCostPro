import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  PlusCircle
} from 'lucide-react'

import { useNavigation } from '@/stores/navigation'
import { useCustomerStore } from '@/stores/customers'
import { useItemStore } from '@/stores/items'
import { useJobStore } from '@/stores/jobs'
import { useMachineStore } from '@/stores/machines'
import { useEmployeeStore } from '@/stores/employees'

import { useJobCostCalculator, type JobFormCostData } from '@/hooks/useJobCostCalculator'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { MachineFieldSchema } from '@/types/models'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'

import { DynamicField } from '@/components/job/DynamicField'
import { CostSummary } from '@/components/job/CostSummary'
import { AutoFillSuggestion } from '@/components/job/AutoFillSuggestion'

// ---------- Types ----------

interface FormState {
  date: Date
  customerId: number | null
  employeeId: number | null
  itemId: number | null
  categoryId: number | null
  quantity: number
  rate: number
  cooly: number
  machineTypeId: number | null
  machineCustomData: Record<string, unknown>
  machineCost: number
  machineWasteAmount: number
  notes: string
  status: string
}

const DEFAULT_FORM: FormState = {
  date: new Date(),
  customerId: null,
  employeeId: null,
  itemId: null,
  categoryId: null,
  quantity: 0,
  rate: 0,
  cooly: 0,
  machineTypeId: null,
  machineCustomData: {},
  machineCost: 0,
  machineWasteAmount: 0,
  notes: '',
  status: 'pending'
}

// ---------- Component ----------

export function JobFormPage() {
  const { pageParams, navigate } = useNavigation()
  const jobId = pageParams.jobId as number | undefined
  const preselectedMachineId = pageParams.machineTypeId as number | undefined
  const isEditMode = jobId != null
  const formRef = useRef<HTMLFormElement>(null)
  const handleSaveRef = useRef<() => void>(() => {})

  // Stores
  const { customers, fetchCustomers, createCustomer } = useCustomerStore()
  const { items, categories, fetchItems, fetchCategories, getItemsByCategory } = useItemStore()
  const { createJob, updateJob } = useJobStore()
  const { machines, fetchMachines } = useMachineStore()
  const { employees, fetchEmployees } = useEmployeeStore()

  // Form state — pre-fill machine from modal selection if provided
  const [form, setForm] = useState<FormState>(() =>
    preselectedMachineId
      ? { ...DEFAULT_FORM, machineTypeId: preselectedMachineId }
      : DEFAULT_FORM
  )
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
    fetchEmployees()
  }, [fetchCustomers, fetchItems, fetchCategories, fetchMachines, fetchEmployees])

  // Load existing job if editing
  useEffect(() => {
    if (!isEditMode || !jobId) return

    async function loadJob() {
      try {
        const allJobs = await window.api.jobs.list()
        const job = allJobs.find((j) => j.id === jobId)
        if (!job) return

        const item = items.find((i) => i.id === job.itemId)

        setForm({
          date: new Date(job.date),
          customerId: job.customerId,
          employeeId: job.employeeId ?? null,
          itemId: job.itemId,
          categoryId: item?.categoryId ?? null,
          quantity: job.quantity,
          rate: job.rate,
          cooly: job.cooly,
          machineTypeId: job.machineTypeId ?? null,
          machineCustomData: job.machineCustomData
            ? JSON.parse(typeof job.machineCustomData === 'string' ? job.machineCustomData : '{}')
            : {},
          machineCost: job.machineCost ?? 0,
          machineWasteAmount: job.machineWasteAmount ?? 0,
          notes: job.notes ?? '',
          status: job.status
        })
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
            cooly: result.cooly ?? prev.cooly,
            machineTypeId: result.machineTypeId ?? prev.machineTypeId,
            machineCustomData: result.machineCustomData
              ? JSON.parse(
                  typeof result.machineCustomData === 'string' ? result.machineCustomData : '{}'
                )
              : prev.machineCustomData,
            machineCost: result.machineCost ?? prev.machineCost,
            machineWasteAmount: result.machineWasteAmount ?? prev.machineWasteAmount
          }))
          setAutoFillJobNumber(result.jobNumber ?? null)
        }
      } catch {
        // No auto-fill data available
      }
    }

    tryAutoFill()
  }, [form.customerId, form.itemId, isEditMode])

  // Derived data
  const selectedCustomer = customers.find((c) => c.id === form.customerId)
  const filteredItems = form.categoryId ? getItemsByCategory(form.categoryId) : items
  const selectedItem = items.find((i) => i.id === form.itemId)
  const baseAmount = form.quantity * form.rate

  // Selected machine type & schema
  const selectedMachine = machines.find((m) => m.id === form.machineTypeId)
  const machineSchema: MachineFieldSchema[] = selectedMachine
    ? (() => {
        try {
          return JSON.parse(selectedMachine.customFieldsSchema) as MachineFieldSchema[]
        } catch {
          return []
        }
      })()
    : []

  // Cost calculator
  const costData: JobFormCostData = {
    quantity: form.quantity,
    rate: form.rate,
    cooly: form.cooly,
    machineTypeId: form.machineTypeId,
    machineCost: form.machineCost,
    machineWasteAmount: form.machineWasteAmount
  }
  const costBreakdown = useJobCostCalculator(costData, machines)

  // ---------- Focus / keyboard navigation ----------

  const advanceToNextField = useCallback((currentEl?: HTMLElement) => {
    const formEl = formRef.current
    if (!formEl) return
    const focusable = Array.from(
      formEl.querySelectorAll<HTMLElement>(
        'input:not([disabled]):not([readonly]), textarea:not([disabled]), button[role="combobox"], [data-field-trigger]'
      )
    )
    if (!currentEl) {
      // If no current element, try to advance from document.activeElement
      currentEl = document.activeElement as HTMLElement
    }
    const idx = focusable.indexOf(currentEl)
    if (idx >= 0 && idx < focusable.length - 1) {
      focusable[idx + 1].focus()
    }
  }, [])

  // Auto-focus customer combobox on mount (new job only)
  useEffect(() => {
    if (isEditMode) return
    // Wait for data to load, then focus
    const timer = setTimeout(() => {
      const formEl = formRef.current
      if (!formEl) return
      const customerBtn = formEl.querySelector<HTMLElement>('button[role="combobox"]')
      customerBtn?.focus()
    }, 300)
    return () => clearTimeout(timer)
  }, [isEditMode])

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

  const handleMachineChange = (val: string) => {
    if (val === 'none') {
      setForm((prev) => ({
        ...prev,
        machineTypeId: null,
        machineCustomData: {},
        machineCost: 0,
        machineWasteAmount: 0
      }))
    } else {
      setForm((prev) => ({
        ...prev,
        machineTypeId: Number(val),
        machineCustomData: {},
        machineCost: 0,
        machineWasteAmount: 0
      }))
    }
  }

  const handleMachineCustomDataChange = (name: string, value: unknown) => {
    setForm((prev) => ({
      ...prev,
      machineCustomData: { ...prev.machineCustomData, [name]: value }
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
    // Date must be within one week of today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const oneWeekAgo = new Date(today)
    oneWeekAgo.setDate(today.getDate() - 7)
    const oneWeekAhead = new Date(today)
    oneWeekAhead.setDate(today.getDate() + 7)
    const jobDate = new Date(form.date)
    jobDate.setHours(0, 0, 0, 0)
    if (jobDate < oneWeekAgo || jobDate > oneWeekAhead) {
      toast.error('Job date must be within one week of today')
      return
    }

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
        employeeId: form.employeeId,
        itemId: form.itemId,
        quantity: form.quantity,
        rate: form.rate,
        amount: baseAmount,
        wasteAmount: 0,
        cooly: form.cooly,
        totalAmount: costBreakdown.grandTotal,
        machineTypeId: form.machineTypeId,
        machineCustomData: JSON.stringify(form.machineCustomData),
        machineCost: form.machineCost,
        machineWasteAmount: form.machineWasteAmount,
        notes: form.notes || null,
        status: form.status
      }

      if (isEditMode && jobId) {
        await updateJob(jobId, jobData)
        toast.success('Job updated successfully')
      } else {
        const job = await createJob(jobData as any)
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

  handleSaveRef.current = handleSave

  const handleCancel = () => {
    navigate('jobs')
  }

  // Auto-select text on focus for number inputs
  const selectOnFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }, [])

  // Enter-to-advance for inputs
  const handleFieldKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return
      e.preventDefault()
      advanceToNextField(e.currentTarget)
    },
    [advanceToNextField]
  )

  // Auto-advance helper for Select onValueChange (finds trigger, then advances)
  const advanceFromTrigger = useCallback(
    (triggerId?: string) => {
      setTimeout(() => {
        const formEl = formRef.current
        if (!formEl) return
        let triggerEl: HTMLElement | null = null
        if (triggerId) {
          triggerEl = formEl.querySelector<HTMLElement>(`#${triggerId}`)
        }
        if (!triggerEl) {
          triggerEl = document.activeElement as HTMLElement
        }
        advanceToNextField(triggerEl)
      }, 0)
    },
    [advanceToNextField]
  )

  // Ctrl+S to save, Escape to go back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveRef.current()
      }
      if (e.key === 'Escape') {
        navigate('jobs')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  return (
    <form
      ref={formRef}
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        handleSave()
      }}
    >
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          {isEditMode ? 'Edit Job' : 'New Job'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? `Editing job #${jobId}. Update job details.`
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

      {/* ===== Section 1: Job Details ===== */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          {/* Row 1: Date | Customer | Employee */}
          <h3 className="text-sm font-medium text-muted-foreground">Date & Customer</h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
            {/* Date Picker */}
            <div className="space-y-1">
              <Label>Date</Label>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-field-trigger
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
                        // Advance to customer combobox after date selection
                        setTimeout(() => {
                          const formEl = formRef.current
                          if (!formEl) return
                          const dateTrigger = formEl.querySelector<HTMLElement>('[data-field-trigger]')
                          if (dateTrigger) advanceToNextField(dateTrigger)
                        }, 0)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Customer Combobox */}
            <div className="space-y-1">
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
                              // Advance to employee after customer selection
                              setTimeout(() => {
                                const formEl = formRef.current
                                if (!formEl) return
                                const customerBtn = formEl.querySelector<HTMLElement>('button[role="combobox"]')
                                if (customerBtn) advanceToNextField(customerBtn)
                              }, 0)
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

            {/* Employee Select */}
            <div className="space-y-1">
              <Label>Employee</Label>
              <Select
                value={form.employeeId ? String(form.employeeId) : ''}
                onValueChange={(val) => {
                  updateForm('employeeId', val ? Number(val) : null)
                  advanceFromTrigger('employee-trigger')
                }}
              >
                <SelectTrigger id="employee-trigger" className="w-full" data-field-trigger>
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.name}
                      {emp.machineTypeName ? ` (${emp.machineTypeName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Row 2: Category | Item | Size */}
          <h3 className="text-sm font-medium text-muted-foreground">Item Selection</h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
            {/* Category */}
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={form.categoryId ? String(form.categoryId) : ''}
                onValueChange={(val) => {
                  handleCategoryChange(val)
                  advanceFromTrigger('category-trigger')
                }}
              >
                <SelectTrigger id="category-trigger" className="w-full" data-field-trigger>
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
            <div className="space-y-1">
              <Label>Item</Label>
              <Select
                value={form.itemId ? String(form.itemId) : ''}
                onValueChange={(val) => {
                  handleItemChange(val)
                  advanceFromTrigger('item-trigger')
                }}
              >
                <SelectTrigger id="item-trigger" className="w-full" data-field-trigger>
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
            <div className="space-y-1">
              <Label>Size</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm">
                {selectedItem?.size || 'Select an item first'}
              </div>
            </div>
          </div>

          <Separator />

          {/* Row 3: Quantity | Rate | Amount */}
          <h3 className="text-sm font-medium text-muted-foreground">Quantity & Rate</h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                value={form.quantity || ''}
                onChange={(e) => updateForm('quantity', Number(e.target.value) || 0)}
                onKeyDown={handleFieldKeyDown}
                onFocus={selectOnFocus}
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rate">Rate (per unit)</Label>
              <Input
                id="rate"
                type="number"
                min={0}
                step="0.01"
                value={form.rate || ''}
                onChange={(e) => updateForm('rate', Number(e.target.value) || 0)}
                onKeyDown={handleFieldKeyDown}
                onFocus={selectOnFocus}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label>Amount</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                {formatINR(baseAmount)}
              </div>
            </div>
          </div>

          {/* Row 4: Cooly */}
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="cooly">Cooly (Labor)</Label>
              <Input
                id="cooly"
                type="number"
                min={0}
                step="0.01"
                value={form.cooly || ''}
                onChange={(e) => updateForm('cooly', Number(e.target.value) || 0)}
                onKeyDown={handleFieldKeyDown}
                onFocus={selectOnFocus}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Section 2: Machine ===== */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Machine</h3>
          <div className="space-y-1">
            <Label>Machine Type</Label>
            {preselectedMachineId && !isEditMode ? (
              <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm font-medium max-w-sm">
                {selectedMachine?.name ?? 'Loading...'}
              </div>
            ) : (
              <Select
                value={form.machineTypeId ? String(form.machineTypeId) : 'none'}
                onValueChange={(val) => {
                  handleMachineChange(val)
                  advanceFromTrigger('machine-trigger')
                }}
              >
                <SelectTrigger id="machine-trigger" className="w-full max-w-sm" data-field-trigger>
                  <SelectValue placeholder="Select machine..." />
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
            )}
          </div>

          {selectedMachine && (
            <>
              {machineSchema.length > 0 && (
                <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {machineSchema.map((field) => (
                    <DynamicField
                      key={field.name}
                      field={field}
                      value={form.machineCustomData[field.name]}
                      onChange={handleMachineCustomDataChange}
                      onAdvance={() => advanceFromTrigger()}
                    />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="machine-cost">Cost</Label>
                  <Input
                    id="machine-cost"
                    type="number"
                    min={0}
                    value={form.machineCost || ''}
                    onChange={(e) => updateForm('machineCost', Number(e.target.value) || 0)}
                    onKeyDown={handleFieldKeyDown}
                    onFocus={selectOnFocus}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="machine-waste-amount">Waste Amount</Label>
                  <Input
                    id="machine-waste-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.machineWasteAmount || ''}
                    onChange={(e) => updateForm('machineWasteAmount', Number(e.target.value) || 0)}
                    onKeyDown={handleFieldKeyDown}
                    onFocus={selectOnFocus}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ===== Section 3: Summary & Finish ===== */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
            {/* Left: Cost Summary */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Cost Summary</h3>
              <CostSummary breakdown={costBreakdown} />
            </div>

            {/* Right: Notes + Status + Buttons */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Notes & Status</h3>
              <div className="space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.notes}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  placeholder="Optional notes about this job..."
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => updateForm('status', val)}
                >
                  <SelectTrigger className="w-full" data-field-trigger>
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

              <Separator />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : isEditMode ? 'Update Job' : 'Create Job'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Quick-Add Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            setTimeout(() => {
              document.getElementById('new-customer-name')?.focus()
            }, 0)
          }}
        >
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    document.getElementById('new-customer-phone')?.focus()
                  }
                }}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-customer-phone">Phone</Label>
              <Input
                id="new-customer-phone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCustomerQuickAdd()
                  }
                }}
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
    </form>
  )
}
