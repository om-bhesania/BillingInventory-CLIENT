import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

type Item = { id: string; name: string };

const PackagingTypeSelect = ({ formik, items, addItem, fetchItems }: { formik: any; items: Item[]; addItem: (data: { name: string }) => Promise<Item>; fetchItems: () => Promise<any> }) => {
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (lastAddedId && items.length > 0) {
      const added = items.find((x) => x.id === lastAddedId);
      if (added) {
        formik.setFieldValue("packagingTypeId", added.id);
        setLastAddedId(null);
      }
    }
  }, [items, lastAddedId, formik]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    formik.setFieldValue("packagingTypeId", "adding...");
    const res = await addItem({ name: newName.trim() });
    if (res?.id) setLastAddedId(res.id);
    setNewName("");
    setShowNewInput(false);
    await fetchItems();
  };

  return (
    <>
      {!showNewInput ? (
        <Select
          value={formik.values.packagingTypeId}
          onValueChange={(value) => {
            if (value === "add-new") setShowNewInput(true);
            else formik.setFieldValue("packagingTypeId", value);
          }}
        >
          <SelectTrigger id="packagingTypeId">
            <SelectValue placeholder="Select packaging type" />
          </SelectTrigger>
          <SelectContent>
            {items.map((it) => (
              <SelectItem key={it.id} value={it.id}>
                {it.name}
              </SelectItem>
            ))}
            <SelectItem value="add-new" className="text-primary font-medium">
              + Add new Packaging Type
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Input
          id="newPackagingType"
          name="packagingTypeId"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter new packaging type"
          contentRight={
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="xs" onClick={() => setShowNewInput(false)}>
                Cancel
              </Button>
              <Button type="button" variant="default" size="xs" onClick={handleAdd}>
                Add
              </Button>
            </div>
          }
        />
      )}
    </>
  );
};

export default PackagingTypeSelect;


