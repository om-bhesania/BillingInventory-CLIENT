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
import { addRawMaterials } from "@/apis/rawMaterialApi";
import UnitsSelect from "@/components/inventory/UnitsSelect";
import { getUnits, addUnits } from "@/apis/unitApi";

const RawMaterialSelect = ({
  formik,
  rawMaterials,
  addRawMaterials: addRawMaterialsProp,
  fetchRawMaterials,
}) => {
  const [showNewRawMaterialInput, setShowNewRawMaterialInput] = useState(false);
  const [newRawMaterialName, setNewRawMaterialName] = useState("");
  const [newRawMaterialUnit, setNewRawMaterialUnit] = useState("pieces");
  const [lastAddedRawMaterialId, setLastAddedRawMaterialId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [units, setUnits] = useState<any[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setIsLoadingUnits(true);
      const unitsData = await getUnits();
      setUnits((unitsData as any[]) || []);
      // Set default unit if available
      if (unitsData && unitsData.length > 0) {
        const defaultUnit = (unitsData as any[]).find((u: any) => u.symbol === "pieces" || u.name.toLowerCase() === "pieces");
        if (defaultUnit) {
          setNewRawMaterialUnit(defaultUnit.symbol || defaultUnit.name);
        }
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setIsLoadingUnits(false);
    }
  };

  // Effect to select the newly added raw material once it's available in the list
  useEffect(() => {
    if (lastAddedRawMaterialId && rawMaterials.length > 0) {
      const addedRawMaterial = rawMaterials.find(
        (material) => material.id === lastAddedRawMaterialId
      );
      if (addedRawMaterial) {
        formik.setFieldValue("rawMaterialId", addedRawMaterial.id);
        setLastAddedRawMaterialId(null); // Reset after selection
      }
    }
  }, [rawMaterials, lastAddedRawMaterialId, formik]);

  const handleAddNewRawMaterial = async () => {
    try {
      if (newRawMaterialName.trim()) {
        const newRawMaterial = {
          name: newRawMaterialName.trim(),
          unit: newRawMaterialUnit,
        };

        setIsSubmitting(true);
        const res = await addRawMaterialsProp(newRawMaterial);
        console.log("res", res);

        // Store the ID of the newly created raw material
        if (res && res.id) {
          setLastAddedRawMaterialId(res.id);
        }

        // Reset the input and hide it
        setNewRawMaterialName("");
        // Reset to first available unit or "pieces"
        if (units.length > 0) {
          const defaultUnit = units.find((u: any) => u.symbol === "pieces" || u.name.toLowerCase() === "pieces");
          setNewRawMaterialUnit(defaultUnit ? (defaultUnit.symbol || defaultUnit.name) : (units[0].symbol || units[0].name));
        } else {
          setNewRawMaterialUnit("pieces");
        }
        setShowNewRawMaterialInput(false);

        // Fetch updated raw materials list
        await fetchRawMaterials();
      }
    } catch (error) {
      console.error("Error adding raw material:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRawMaterialCancel = () => {
    setNewRawMaterialName("");
    // Reset to first available unit or "pieces"
    if (units.length > 0) {
      const defaultUnit = units.find((u: any) => u.symbol === "pieces" || u.name.toLowerCase() === "pieces");
      setNewRawMaterialUnit(defaultUnit ? (defaultUnit.symbol || defaultUnit.name) : (units[0].symbol || units[0].name));
    } else {
      setNewRawMaterialUnit("pieces");
    }
    setShowNewRawMaterialInput(false);
  };

  return (
    <>
      {!showNewRawMaterialInput ? (
        <Select
          value={formik.values.rawMaterialId}
          onValueChange={(value) => {
            if (value === "add-new") {
              setShowNewRawMaterialInput(true);
            } else {
              formik.setFieldValue("rawMaterialId", value);
            }
          }}
        >
          <SelectTrigger id="rawMaterialId" disabled={isSubmitting}>
            <div className="flex items-center gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <SelectValue placeholder="Select raw material" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {rawMaterials.map((material) => (
              <SelectItem key={material.id} value={material.id}>
                {material.name} ({material.unit})
              </SelectItem>
            ))}
            <SelectItem value="add-new" className="text-primary font-medium">
              + Add new Raw Material
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="space-y-2">
          <Input
            id="newRawMaterialName"
            value={newRawMaterialName}
            onChange={(e) => setNewRawMaterialName(e.target.value)}
            placeholder="Enter new raw material name"
          />
          {isLoadingUnits ? (
            <div className="flex items-center gap-2 p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading units...</span>
            </div>
          ) : (
            <UnitsSelect
              formik={{
                values: { unit: newRawMaterialUnit },
                setFieldValue: (field: string, value: string) => {
                  if (field === "unit") {
                    setNewRawMaterialUnit(value);
                  }
                },
              } as any}
              units={units}
              addUnits={addUnits}
              fetchUnits={fetchUnits}
            />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRawMaterialCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleAddNewRawMaterial}
              disabled={isSubmitting || !newRawMaterialName.trim()}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Adding...
                </span>
              ) : (
                "Add"
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default RawMaterialSelect;

