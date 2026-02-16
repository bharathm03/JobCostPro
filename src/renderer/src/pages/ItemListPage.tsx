import { useEffect, useState, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useItemStore } from '@/stores/items'
import type { Item } from '@/types/models'
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

interface ItemFormData {
  name: string
  categoryId: string
  size: string
}

const emptyForm: ItemFormData = { name: '', categoryId: '', size: '' }

export function ItemListPage() {
  const { items, categories, loading, fetchItems, fetchCategories, createItem, updateItem, deleteItem } =
    useItemStore()

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [form, setForm] = useState<ItemFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    fetchItems().catch(() => toast.error('Failed to load items'))
    fetchCategories().catch(() => toast.error('Failed to load categories'))
  }, [fetchItems, fetchCategories])

  const filteredItems = useMemo(() => {
    if (categoryFilter === 'all') return items
    return items.filter((item) => item.categoryId === Number(categoryFilter))
  }, [items, categoryFilter])

  const categoryMap = useMemo(() => {
    const map: Record<number, string> = {}
    for (const cat of categories) {
      map[cat.id] = cat.name
    }
    return map
  }, [categories])

  function openAddDialog() {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(item: Item) {
    setEditingItem(item)
    setForm({
      name: item.name,
      categoryId: String(item.categoryId),
      size: item.size
    })
    setDialogOpen(true)
  }

  function openDeleteConfirm(item: Item) {
    setDeleteTarget(item)
    setConfirmOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Item name is required')
      return
    }
    if (!form.categoryId) {
      toast.error('Category is required')
      return
    }
    if (!form.size.trim()) {
      toast.error('Size is required')
      return
    }

    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        categoryId: Number(form.categoryId),
        size: form.size.trim()
      }

      if (editingItem) {
        await updateItem(editingItem.id, data)
        toast.success('Item updated successfully')
      } else {
        await createItem(data)
        toast.success('Item created successfully')
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteItem(deleteTarget.id)
      toast.success('Item deleted successfully')
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete item')
    }
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Items</h1>
          <p className="text-muted-foreground">Manage production items and categories.</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus />
          Add Item
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-3">
        <Label>Category:</Label>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">
            {items.length === 0 ? 'No items yet. Add your first item to get started.' : 'No items match the selected category.'}
          </p>
          {items.length === 0 && (
            <Button onClick={openAddDialog}>
              <Plus />
              Add First Item
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{categoryMap[item.categoryId] ?? '-'}</TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openDeleteConfirm(item)}
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
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Name *</Label>
              <Input
                id="item-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Item name"
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={form.categoryId}
                onValueChange={(val) => setForm({ ...form, categoryId: val })}
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
            <div className="space-y-2">
              <Label htmlFor="item-size">Size *</Label>
              <Input
                id="item-size"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                placeholder="e.g. 12x18, A4, etc."
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
        title="Delete Item"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
