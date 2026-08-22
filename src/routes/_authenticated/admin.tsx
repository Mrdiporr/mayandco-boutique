import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { naira } from "@/lib/format";
import { SIZES, type Size } from "@/lib/products";
import {
  deleteCatalogueItem,
  deleteCategory,
  deleteProduct,
  getAdminData,
  reorderCatalogue,
  saveCatalogueItem,
  saveCategory,
  saveProduct,
  saveSettings,
  updateOrder,
  updateRequestStatus,
  uploadStoreImage,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Studio Dashboard — MAY & CO." },
      {
        name: "description",
        content: "Manage MAY & CO. products, categories, catalogue imagery, orders and requests.",
      },
      { property: "og:title", content: "Studio Dashboard — MAY & CO." },
      { property: "og:description", content: "Private MAY & CO. store management." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type AdminData = Awaited<ReturnType<typeof getAdminData>>;
type ProductRow = AdminData["products"][number];
type CatalogueRow = AdminData["catalogue"][number];

function AdminPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-data"],
    queryFn: () => getAdminData(),
    retry: false,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-data"] });
    qc.invalidateQueries({ queryKey: ["storefront"] });
    qc.invalidateQueries({ queryKey: ["catalogue"] });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Studio access required</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          This account is not an administrator yet. Ask the store owner to grant admin access.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button
            variant="outline"
            className="rounded-none"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/auth";
            }}
          >
            Sign out
          </Button>
          <Button asChild className="rounded-none">
            <Link to="/">Back to store</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-10">
          <div>
            <p className="eyebrow text-muted-foreground">MAY &amp; CO.</p>
            <h1 className="font-display text-2xl">Studio Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="ghost" className="rounded-none">
              <Link to="/">View store</Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-none"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/auth";
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <Tabs defaultValue="orders">
          <TabsList className="flex w-full flex-wrap justify-start rounded-none">
            <TabsTrigger value="orders">Orders ({data.orders.length})</TabsTrigger>
            <TabsTrigger value="products">Products ({data.products.length})</TabsTrigger>
            <TabsTrigger value="catalogue">Catalogue ({data.catalogue.length})</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="requests">Requests ({data.requests.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-8">
            <OrdersPanel data={data} onSaved={refresh} />
          </TabsContent>
          <TabsContent value="products" className="mt-8">
            <ProductsPanel data={data} onSaved={refresh} />
          </TabsContent>
          <TabsContent value="catalogue" className="mt-8">
            <CataloguePanel data={data} onSaved={refresh} />
          </TabsContent>
          <TabsContent value="categories" className="mt-8">
            <CategoriesPanel data={data} onSaved={refresh} />
          </TabsContent>
          <TabsContent value="requests" className="mt-8">
            <RequestsPanel data={data} onSaved={refresh} />
          </TabsContent>
          <TabsContent value="settings" className="mt-8">
            <SettingsPanel data={data} onSaved={refresh} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------------- shared bits ---------------- */

function Card({ children }: { children: React.ReactNode }) {
  return <div className="border border-border bg-background p-6">{children}</div>;
}

function ImageField({
  value,
  onChange,
  label = "Image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (file.size > 6_000_000) {
      toast.error("Image must be under 6MB");
      return;
    }
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      }
      const result = await uploadStoreImage({
        data: { filename: file.name, contentType: file.type, base64: btoa(binary) },
      });
      onChange(result.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Label className="eyebrow text-muted-foreground">{label}</Label>
      <div className="mt-2 flex items-start gap-4">
        {value ? (
          <img src={value} alt="" className="h-24 w-20 border border-border object-cover" />
        ) : (
          <div className="h-24 w-20 border border-dashed border-border" />
        )}
        <div className="flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Image URL"
            className="rounded-none"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            className="mt-2 rounded-none"
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="mr-2 h-3.5 w-3.5" />
            )}
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- orders ---------------- */

const ORDER_STATUSES = [
  "pending_payment",
  "awaiting_whatsapp",
  "paid",
  "fulfilled",
  "cancelled",
] as const;

function OrdersPanel({ data, onSaved }: { data: AdminData; onSaved: () => void }) {
  if (data.orders.length === 0) {
    return <p className="text-sm text-muted-foreground">No orders yet.</p>;
  }
  return (
    <div className="grid gap-5">
      {data.orders.map((order: any) => {
        const items = data.orderItems.filter((i: any) => i.order_id === order.id);
        return (
          <Card key={order.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-xl">{order.reference}</p>
                <p className="text-sm text-muted-foreground">
                  {order.customer_name} · {order.phone} · {order.city}, {order.state}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString()} · {order.channel}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl">{naira(order.total)}</p>
                {order.has_pre_order && (
                  <p className="eyebrow text-accent-foreground">Contains pre-order</p>
                )}
              </div>
            </div>
            <ul className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
              {items.map((i: any) => (
                <li key={i.id} className="flex justify-between">
                  <span>
                    {i.name} · {i.size} × {i.quantity}
                    {i.pre_order ? " · pre-order" : ""}
                  </span>
                  <span>{naira(i.unit_price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <OrderControls order={order} onSaved={onSaved} />
          </Card>
        );
      })}
    </div>
  );
}

function OrderControls({ order, onSaved }: { order: any; onSaved: () => void }) {
  const [status, setStatus] = useState<string>(order.status);
  const [notes, setNotes] = useState<string>(order.admin_notes ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateOrder({ data: { id: order.id, status: status as any, adminNotes: notes } });
      toast.success("Order updated");
      onSaved();
    } catch {
      toast.error("Could not update order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-[200px_1fr_auto]">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="rounded-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={notes}
        maxLength={1000}
        placeholder="Internal notes"
        onChange={(e) => setNotes(e.target.value)}
        className="rounded-none"
      />
      <div className="flex gap-2">
        <Button onClick={save} disabled={busy} className="rounded-none">
          Save
        </Button>
        <Button asChild variant="outline" className="rounded-none">
          <a
            href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}

/* ---------------- products ---------------- */

const blankProduct = () => ({
  slug: "",
  name: "",
  price: 0,
  category_slug: "clothing",
  image: "",
  editorial: "",
  details: [] as string[],
  is_new: true,
  active: true,
  position: 0,
  product_variants: [] as { size: string; stock: number }[],
});

function ProductsPanel({ data, onSaved }: { data: AdminData; onSaved: () => void }) {
  const [editing, setEditing] = useState<any | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Products</h2>
          <Button className="rounded-none" onClick={() => setEditing(blankProduct())}>
            <Plus className="mr-2 h-4 w-4" /> New product
          </Button>
        </div>
        <div className="grid gap-3">
          {data.products.map((p: any) => (
            <button
              key={p.id}
              onClick={() => setEditing(p)}
              className="flex items-center gap-4 border border-border bg-background p-3 text-left hover:border-foreground"
            >
              <img src={p.image} alt="" className="h-16 w-14 object-cover" />
              <span className="flex-1">
                <span className="block font-medium">{p.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {naira(p.price)} · {p.category_slug} · {p.active ? "active" : "hidden"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div>
        {editing ? (
          <ProductForm
            key={editing.id ?? "new"}
            product={editing}
            categories={data.categories}
            onDone={() => {
              setEditing(null);
              onSaved();
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">
              Select a product to edit, or create a new one.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function ProductForm({
  product,
  categories,
  onDone,
  onCancel,
}: {
  product: any;
  categories: any[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const initialStock = useMemo(() => {
    const stock: Record<Size, number> = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
    for (const v of product.product_variants ?? []) {
      if ((SIZES as readonly string[]).includes(v.size)) stock[v.size as Size] = v.stock;
    }
    return stock;
  }, [product]);

  const [form, setForm] = useState({
    slug: product.slug ?? "",
    name: product.name ?? "",
    price: product.price ?? 0,
    categorySlug: product.category_slug ?? "clothing",
    image: product.image ?? "",
    editorial: product.editorial ?? "",
    details: (product.details ?? []).join("\n"),
    isNew: product.is_new ?? true,
    active: product.active ?? true,
    position: product.position ?? 0,
  });
  const [stock, setStock] = useState(initialStock);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await saveProduct({
        data: {
          ...(product.id ? { id: product.id } : {}),
          slug: form.slug.trim(),
          name: form.name.trim(),
          price: Number(form.price) || 0,
          categorySlug: form.categorySlug,
          image: form.image.trim(),
          editorial: form.editorial.trim(),
          details: form.details
            .split("\n")
            .map((d) => d.trim())
            .filter(Boolean),
          isNew: form.isNew,
          active: form.active,
          position: Number(form.position) || 0,
          stock,
        },
      });
      toast.success("Product saved");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!product.id || !window.confirm("Delete this product?")) return;
    try {
      await deleteProduct({ data: { id: product.id } });
      toast.success("Product deleted");
      onDone();
    } catch {
      toast.error("Could not delete product");
    }
  };

  return (
    <Card>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label className="eyebrow text-muted-foreground">Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-2 rounded-none"
          />
        </div>
        <div>
          <Label className="eyebrow text-muted-foreground">Slug</Label>
          <Input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="mt-2 rounded-none"
          />
        </div>
        <div>
          <Label className="eyebrow text-muted-foreground">Price (₦)</Label>
          <Input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="mt-2 rounded-none"
          />
        </div>
        <div>
          <Label className="eyebrow text-muted-foreground">Category</Label>
          <Select
            value={form.categorySlug}
            onValueChange={(v) => setForm({ ...form, categorySlug: v })}
          >
            <SelectTrigger className="mt-2 rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <ImageField value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
        </div>
        <div className="sm:col-span-2">
          <Label className="eyebrow text-muted-foreground">Editorial copy</Label>
          <Textarea
            rows={3}
            value={form.editorial}
            onChange={(e) => setForm({ ...form, editorial: e.target.value })}
            className="mt-2 rounded-none"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="eyebrow text-muted-foreground">Details (one per line)</Label>
          <Textarea
            rows={3}
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            className="mt-2 rounded-none"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="eyebrow text-muted-foreground">Stock by size</Label>
          <div className="mt-2 grid grid-cols-5 gap-3">
            {SIZES.map((s) => (
              <div key={s}>
                <span className="text-xs text-muted-foreground">{s}</span>
                <Input
                  type="number"
                  min={0}
                  value={stock[s]}
                  onChange={(e) => setStock({ ...stock, [s]: Number(e.target.value) || 0 })}
                  className="mt-1 rounded-none"
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            A size at 0 automatically switches that variant to pre-order on the storefront.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={form.isNew}
            onCheckedChange={(v) => setForm({ ...form, isNew: v })}
            id="isNew"
          />
          <Label htmlFor="isNew">New arrival</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={form.active}
            onCheckedChange={(v) => setForm({ ...form, active: v })}
            id="active"
          />
          <Label htmlFor="active">Visible in store</Label>
        </div>
        <div>
          <Label className="eyebrow text-muted-foreground">Sort position</Label>
          <Input
            type="number"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
            className="mt-2 rounded-none"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={save} disabled={busy} className="rounded-none">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save product
        </Button>
        <Button variant="outline" className="rounded-none" onClick={onCancel}>
          Cancel
        </Button>
        {product.id && (
          <Button variant="destructive" className="rounded-none" onClick={remove}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        )}
      </div>
    </Card>
  );
}

/* ---------------- catalogue ---------------- */

function CataloguePanel({ data, onSaved }: { data: AdminData; onSaved: () => void }) {
  const [items, setItems] = useState<CatalogueRow[]>(data.catalogue as CatalogueRow[]);
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => setItems(data.catalogue as CatalogueRow[]), [data.catalogue]);

  const move = async (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    const b = next[target]!;
    next[index] = b;
    next[target] = a;
    setItems(next);
    try {
      await reorderCatalogue({
        data: { items: next.map((item, i) => ({ id: item.id, position: i })) },
      });
      onSaved();
    } catch {
      toast.error("Could not reorder");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Catalogue sets</h2>
          <Button
            className="rounded-none"
            onClick={() =>
              setEditing({ title: "", tag: "", note: "", image: "", visible: true, position: items.length })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> New set
          </Button>
        </div>
        <div className="grid gap-3">
          {items.map((item: any, index: number) => (
            <div
              key={item.id}
              className="flex items-center gap-3 border border-border bg-background p-3"
            >
              <img src={item.image} alt="" className="h-16 w-14 object-cover" />
              <button className="flex-1 text-left" onClick={() => setEditing(item)}>
                <span className="block font-medium">{item.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {item.tag} · {item.visible ? "visible" : "hidden"}
                </span>
              </button>
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" onClick={() => move(index, -1)} aria-label="Move up">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => move(index, 1)} aria-label="Move down">
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        {editing ? (
          <CatalogueForm
            key={editing.id ?? "new"}
            item={editing}
            onDone={() => {
              setEditing(null);
              onSaved();
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">
              Select a set to edit its imagery and copy, or add a new one. Use the arrows to change
              the order shoppers see in the 3D gallery.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function CatalogueForm({
  item,
  onDone,
  onCancel,
}: {
  item: any;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: item.title ?? "",
    tag: item.tag ?? "",
    note: item.note ?? "",
    image: item.image ?? "",
    visible: item.visible ?? true,
    position: item.position ?? 0,
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await saveCatalogueItem({
        data: {
          ...(item.id ? { id: item.id } : {}),
          title: form.title.trim(),
          tag: form.tag.trim(),
          note: form.note.trim(),
          image: form.image.trim(),
          visible: form.visible,
          position: Number(form.position) || 0,
        },
      });
      toast.success("Catalogue set saved");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!item.id || !window.confirm("Delete this catalogue set?")) return;
    try {
      await deleteCatalogueItem({ data: { id: item.id } });
      toast.success("Deleted");
      onDone();
    } catch {
      toast.error("Could not delete");
    }
  };

  return (
    <Card>
      <div className="grid gap-5">
        <div>
          <Label className="eyebrow text-muted-foreground">Title</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-2 rounded-none"
          />
        </div>
        <div>
          <Label className="eyebrow text-muted-foreground">Tag</Label>
          <Input
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            className="mt-2 rounded-none"
          />
        </div>
        <ImageField value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
        <div>
          <Label className="eyebrow text-muted-foreground">Note</Label>
          <Textarea
            rows={3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="mt-2 rounded-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="cat-visible"
            checked={form.visible}
            onCheckedChange={(v) => setForm({ ...form, visible: v })}
          />
          <Label htmlFor="cat-visible">Visible in gallery</Label>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={save} disabled={busy} className="rounded-none">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
        </Button>
        <Button variant="outline" className="rounded-none" onClick={onCancel}>
          Cancel
        </Button>
        {item.id && (
          <Button variant="destructive" className="rounded-none" onClick={remove}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        )}
      </div>
    </Card>
  );
}

/* ---------------- categories ---------------- */

function CategoriesPanel({ data, onSaved }: { data: AdminData; onSaved: () => void }) {
  const [draft, setDraft] = useState({ slug: "", name: "", position: data.categories.length });

  const add = async () => {
    try {
      await saveCategory({
        data: {
          slug: draft.slug.trim(),
          name: draft.name.trim(),
          position: Number(draft.position) || 0,
        },
      });
      setDraft({ slug: "", name: "", position: data.categories.length + 1 });
      toast.success("Category saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save category");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="font-display text-2xl">Categories</h2>
        <ul className="mt-5 space-y-3">
          {data.categories.map((c: any) => (
            <li key={c.id} className="flex items-center justify-between border-b border-border pb-3">
              <span>
                {c.name} <span className="text-muted-foreground">/{c.slug}</span>
              </span>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete ${c.name}`}
                onClick={async () => {
                  if (!window.confirm(`Delete ${c.name}?`)) return;
                  try {
                    await deleteCategory({ data: { id: c.id } });
                    onSaved();
                  } catch {
                    toast.error("Could not delete");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-display text-2xl">Add category</h2>
        <div className="mt-5 grid gap-4">
          <Input
            placeholder="Name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="rounded-none"
          />
          <Input
            placeholder="slug"
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            className="rounded-none"
          />
          <Button onClick={add} className="rounded-none">
            Save category
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- requests ---------------- */

function RequestsPanel({ data, onSaved }: { data: AdminData; onSaved: () => void }) {
  if (data.requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No personal shopper requests yet.</p>;
  }
  return (
    <div className="grid gap-5">
      {data.requests.map((r: any) => (
        <Card key={r.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-xl">{r.name}</p>
              <p className="text-sm text-muted-foreground">
                {r.phone} · budget {r.budget || "—"} · sizes {r.sizes || "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Select
                value={r.status}
                onValueChange={async (status) => {
                  try {
                    await updateRequestStatus({ data: { id: r.id, status: status as any } });
                    onSaved();
                  } catch {
                    toast.error("Could not update");
                  }
                }}
              >
                <SelectTrigger className="w-36 rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["new", "quoted", "closed"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button asChild variant="outline" className="rounded-none">
                <a
                  href={`https://wa.me/${String(r.phone).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>
          {Array.isArray(r.items) && r.items.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {r.items.map((i: string) => (
                <li key={i} className="eyebrow border border-border px-3 py-1">
                  {i}
                </li>
              ))}
            </ul>
          )}
          {r.message && <p className="mt-4 text-sm text-muted-foreground">{r.message}</p>}
        </Card>
      ))}
    </div>
  );
}

/* ---------------- settings ---------------- */

function SettingsPanel({ data, onSaved }: { data: AdminData; onSaved: () => void }) {
  const s: any = data.settings ?? {};
  const [form, setForm] = useState({
    whatsappNumber: s.whatsapp_number ?? "",
    bankName: s.bank_name ?? "",
    accountName: s.account_name ?? "",
    accountNumber: s.account_number ?? "",
    shippingFee: s.shipping_fee ?? 5000,
    transferInstructions: s.transfer_instructions ?? "",
    instagramHandle: s.instagram_handle ?? "",
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await saveSettings({
        data: {
          whatsappNumber: form.whatsappNumber.trim(),
          bankName: form.bankName.trim(),
          accountName: form.accountName.trim(),
          accountNumber: form.accountNumber.trim(),
          shippingFee: Number(form.shippingFee) || 0,
          transferInstructions: form.transferInstructions.trim(),
          instagramHandle: form.instagramHandle.trim(),
        },
      });
      toast.success("Settings saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h2 className="font-display text-2xl">Store settings</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {(
          [
            ["whatsappNumber", "WhatsApp number (with country code)"],
            ["bankName", "Bank name"],
            ["accountName", "Account name"],
            ["accountNumber", "Account number"],
            ["shippingFee", "Shipping fee (₦)"],
            ["instagramHandle", "Instagram handle"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <Label className="eyebrow text-muted-foreground">{label}</Label>
            <Input
              value={String(form[key])}
              type={key === "shippingFee" ? "number" : "text"}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="mt-2 rounded-none"
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <Label className="eyebrow text-muted-foreground">Transfer instructions</Label>
          <Textarea
            rows={3}
            value={form.transferInstructions}
            onChange={(e) => setForm({ ...form, transferInstructions: e.target.value })}
            className="mt-2 rounded-none"
          />
        </div>
      </div>
      <Button onClick={save} disabled={busy} className="mt-6 rounded-none">
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save settings
      </Button>
    </Card>
  );
}
