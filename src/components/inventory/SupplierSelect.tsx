import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { 
  createSupplier, 
  getSuppliers,
  Supplier 
} from "@/apis/supplierApi";

const SupplierSelect = ({
  formik,
  suppliers,
  addSuppliers,
  fetchSuppliers,
}) => {
  const [showNewSupplierInput, setShowNewSupplierInput] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierContact, setNewSupplierContact] = useState("");
  const [lastAddedSupplierId, setLastAddedSupplierId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to select the newly added supplier once it's available in the suppliers list
  useEffect(() => {
    if (lastAddedSupplierId && suppliers.length > 0) {
      const addedSupplier = suppliers.find(
        (supplier) => supplier.id === lastAddedSupplierId
      );
      if (addedSupplier) {
        formik.setFieldValue("supplierId", addedSupplier.id);
        setLastAddedSupplierId(null);
      }
    }
  }, [suppliers, lastAddedSupplierId, formik]);

  const handleAddNewSupplier = async () => {
    try {
      if (newSupplierName.trim() && newSupplierContact.trim()) {
        const newSupplier = {
          name: newSupplierName,
          contact: newSupplierContact,
        };

        setIsSubmitting(true);
        const res = await addSuppliers(newSupplier);
        console.log("res", res);

        if (res && res.id) {
          setLastAddedSupplierId(res.id);
        }

        // Reset the inputs and hide the form
        setNewSupplierName("");
        setNewSupplierContact("");
        setShowNewSupplierInput(false);

        // Fetch updated suppliers list
        await fetchSuppliers();
      }
    } catch (error) {
      console.error("Error adding supplier:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupplierCancel = () => {
    setNewSupplierName("");
    setNewSupplierContact("");
    setShowNewSupplierInput(false);
  };

  return (
    <>
      {!showNewSupplierInput ? (
        <Select
          value={formik.values.supplierId}
          onValueChange={(value) => {
            if (value === "add-new") {
              setShowNewSupplierInput(true);
            } else {
              formik.setFieldValue("supplierId", value);
            }
          }}
        >
          <SelectTrigger id="supplierId" disabled={isSubmitting}>
            <div className="flex items-center gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <SelectValue placeholder="Select supplier" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name} - {supplier.contact}
              </SelectItem>
            ))}
            <SelectItem value="add-new" className="text-primary font-medium">
              + Add new Supplier
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="space-y-3">
          <Input
            id="newSupplierName"
            value={newSupplierName}
            onChange={(e) => setNewSupplierName(e.target.value)}
            placeholder="Enter supplier name"
            disabled={isSubmitting}
          />
          <Input
            id="newSupplierContact"
            value={newSupplierContact}
            onChange={(e) => setNewSupplierContact(e.target.value)}
            placeholder="Enter supplier contact number"
            disabled={isSubmitting}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSupplierCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleAddNewSupplier}
              disabled={isSubmitting || !newSupplierName.trim() || !newSupplierContact.trim()}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Adding...
                </span>
              ) : (
                "Add Supplier"
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default SupplierSelect;
