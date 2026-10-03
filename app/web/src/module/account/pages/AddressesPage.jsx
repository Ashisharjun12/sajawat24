import { useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "lucide-react";
import { getApiError } from "@/api/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddressListSkeleton } from "@/module/account/components/AddressListSkeleton";
import { toast } from "@/components/ui/toast";
import { AccountPageTitle } from "@/module/account/components/AccountPageTitle";
import { AddressFormDialog, emptyAddressForm } from "@/module/account/components/AddressFormDialog";
import { useAddressMutations, useAddressesQuery } from "@/module/account/hooks/use-addresses-query";
import { useLocationStore } from "@/store/location.store";

function rowToForm(row) {
  return {
    label: row.label,
    address: row.address,
    landmark: row.landmark ?? "",
    pincode: row.pincode,
    cityName: row.cityName,
    cityId: row.cityId,
    isDefault: row.isDefault,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
  };
}

export function AddressesPage() {
  const locationCity = useLocationStore((s) => s.city);
  const { data: saved = [], isLoading, isError, error } = useAddressesQuery();
  const { create, update, remove, setDefault } = useAddressMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const editingRow = editingId ? saved.find((row) => row.id === editingId) : null;

  function openAddDialog() {
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEditDialog(row) {
    setEditingId(row.id);
    setDialogOpen(true);
  }

  function closeDialog(open) {
    setDialogOpen(open);
    if (!open) setEditingId(null);
  }

  async function onSubmitAddress(body) {
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, body });
        toast.add({ title: "Address updated", type: "success" });
      } else {
        await create.mutateAsync(body);
        toast.add({ title: "Address saved", type: "success" });
      }
      setDialogOpen(false);
      setEditingId(null);
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" });
    }
  }

  async function onRemove(id) {
    try {
      await remove.mutateAsync(id);
      toast.add({ title: "Address removed", type: "info" });
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" });
    }
  }

  async function onSetDefault(id) {
    try {
      await setDefault.mutateAsync(id);
      toast.add({ title: "Default address updated", type: "success" });
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" });
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <AccountPageTitle>Addresses</AccountPageTitle>
      <p className="mt-2 text-sm text-muted-foreground">
        Add and manage delivery addresses for checkout and bookings.
      </p>

      <Button type="button" className="mt-6 gap-2" onClick={openAddDialog}>
        <PlusIcon className="size-4" />
        Add new address
      </Button>

      {isLoading ? <AddressListSkeleton count={2} /> : null}

      {isError ? (
        <p className="mt-6 text-sm text-destructive">{getApiError(error)}</p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {saved.map((row) => (
          <li key={row.id} className="rounded-xl border border-border bg-card px-4 py-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{row.label}</p>
                  {row.isDefault ? (
                    <Badge variant="secondary" className="text-[10px]">Default</Badge>
                  ) : null}
                  {row.latitude != null && row.longitude != null ? (
                    <Badge variant="outline" className="text-[10px]">Pin saved</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {row.cityName ? `${row.cityName} · ${row.pincode}` : row.pincode}
                </p>
                <p
                  className="mt-1 line-clamp-3 break-words text-sm text-foreground"
                  title={row.address}
                >
                  {row.address}
                </p>
                {row.landmark ? (
                  <p className="mt-1 text-sm text-muted-foreground">Landmark: {row.landmark}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button
                  type="button"
                  className="text-xs font-medium text-foreground underline underline-offset-4"
                  onClick={() => openEditDialog(row)}
                >
                  Edit
                </button>
                {!row.isDefault ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-foreground underline underline-offset-4"
                    onClick={() => void onSetDefault(row.id)}
                  >
                    Set default
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-destructive"
                  onClick={() => void onRemove(row.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!isLoading && !isError && saved.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">No saved addresses yet. Add one above.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/decorations">Browse decorations</Link>
          </Button>
        </div>
      ) : null}

      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={closeDialog}
        title={editingId ? "Edit address" : "Add address"}
        submitLabel={editingId ? "Update address" : "Save address"}
        initial={editingRow ? rowToForm(editingRow) : emptyAddressForm}
        submitting={editingId ? update.isPending : create.isPending}
        contextCityId={locationCity?.id ?? null}
        contextCityName={locationCity?.name ?? ""}
        onSubmit={(body) => void onSubmitAddress(body)}
      />
    </div>
  );
}
