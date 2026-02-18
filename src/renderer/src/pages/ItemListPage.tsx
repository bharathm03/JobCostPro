import { useEffect, useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Tags } from 'lucide-react'
import { toast } from 'sonner'
import { useItemStore } from '@/stores/items'
import type { Item, ItemCategory } from '@/types/models'
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
  const {
    items, categories, loading, fetchItems, fetchCategories,
    createItem, updateItem, deleteItem,
    createCategory, updateCategory, deleteCategory
  } = useItemStore()

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [form, setForm] = useState<ItemFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Category management state
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ItemCategory | null>(null)
  const [catName, setCatName] = useState('')
  const [catSaving, setCatSaving] = useState(false)
  const [catDeleteTarget, setCatDeleteTarget] = useState<ItemCategory | null>(null)
  const [catConfirmOpen, setCatConfirmOpen] = useState(false)

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

  // Category management handlers
  function openAddCategory() {
    setEditingCategory(null)
    setCatName('')
    setCatDialogOpen(true)
  }

  function openEditCategory(cat: ItemCategory) {
    setEditingCategory(cat)
    setCatName(cat.name)
    setCatDialogOpen(true)
  }

  function openDeleteCategory(cat: ItemCategory) {
    setCatDeleteTarget(cat)
    setCatConfirmOpen(true)
  }

  async function handleSaveCategory() {
    if (!catName.trim()) {
      toast.error('Category name is required')
      return
    }
    setCatSaving(true)
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: catName.trim() })
        toast.success('Category updated')
      } else {
        await createCategory({ name: catName.trim() })
        toast.success('Category created')
      }
      setCatDialogOpen(false)
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save category')
    } finally {
      setCatSaving(false)
    }
  }

  async function handleDeleteCategory() {
    if (!catDeleteTarget) return
    try {
      await deleteCategory(catDeleteTarget.id)
      toast.success('Category deleted')
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete category')
    }
    setCatDeleteTarget(null)
  }

  // Count items per category for display
  const itemCountByCategory = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const item of items) {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1
    }
    return counts
  }, [items])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Items</h1>
          <p className="text-muted-foreground">Manage production items and categories.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openAddCategory}>
            <Tags />
            Manage Categories
          </Button>
          <Button onClick={openAddDialog}>
            <Plus />
            Add Item
          </Button>
        </div>
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
                      aria-label={`Edit ${item.name}`}
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Delete ${item.name}`}
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

      {/* Manage Categories Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add / Edit form */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="cat-name">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </Label>
                <Input
                  id="cat-name"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Category name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCategory()
                  }}
                />
              </div>
              <Button onClick={handleSaveCategory} disabled={catSaving} size="sm">
                {catSaving ? 'Saving...' : editingCategory ? 'Update' : 'Add'}
              </Button>
              {editingCategory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCategory(null)
                    setCatName('')
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>

            {/* Category list */}
            <div className="border rounded-md max-h-60 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-sm p-4 text-center">
                  No categories yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[80px]">Items</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell>{itemCountByCategory[cat.id] || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Edit ${cat.name}`}
                              onClick={() => openEditCategory(cat)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Delete ${cat.name}`}
                              onClick={() => openDeleteCategory(cat)}
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        open={catConfirmOpen}
        onOpenChange={setCatConfirmOpen}
        title="Delete Category"
        description={`Are you sure you want to delete "${catDeleteTarget?.name}"? This will only work if no items use this category.`}
        onConfirm={handleDeleteCategory}
        variant="destructive"
      />
    </div>
  )
}
