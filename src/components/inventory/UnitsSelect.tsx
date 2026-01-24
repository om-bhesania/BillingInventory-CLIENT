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
import { addUnits, getUnits } from "@/apis/unitApi";

interface Unit {
  id: string;
  name: string;
  symbol?: string;
  description?: string;
  isActive: boolean;
}

const UnitsSelect = ({
  formik,
  units,
  addUnits: addUnitsProp,
  fetchUnits,
}) => {
  const [showNewUnitInput, setShowNewUnitInput] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitSymbol, setNewUnitSymbol] = useState("");
  const [lastAddedUnitId, setLastAddedUnitId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to select the newly added unit once it's available in the units list
  useEffect(() => {
    if (lastAddedUnitId && units.length > 0) {
      // Find the newly added unit by ID
      const addedUnit = units.find(
        (unit: Unit) => unit.id === lastAddedUnitId
      );
      if (addedUnit) {
        // Use symbol if available, otherwise use name
        const unitValue = addedUnit.symbol || addedUnit.name;
        formik.setFieldValue("unit", unitValue);
        setLastAddedUnitId(null); // Reset after selection
      }
    }
  }, [units, lastAddedUnitId, formik]);

  const handleAddNewUnit = async () => {
    try {
      if (newUnitName.trim()) {
        const newUnit = {
          name: newUnitName.trim(),
          symbol: newUnitSymbol.trim() || undefined,
        };

        // Do not set placeholder values that could leak into submission
        setIsSubmitting(true);
        const res = await addUnitsProp(newUnit);
        console.log("res", res);

        // Store the ID of the newly created unit
        if (res && res.id) {
          setLastAddedUnitId(res.id);
        }

        // Reset the input and hide it
        setNewUnitName("");
        setNewUnitSymbol("");
        setShowNewUnitInput(false);

        // Fetch updated units list
        await fetchUnits();
      }
    } catch (error) {
      console.error("Error adding unit:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnitCancel = () => {
    setNewUnitName("");
    setNewUnitSymbol("");
    setShowNewUnitInput(false);
  };

  // Format unit display: "Name (symbol)" or just "Name"
  const formatUnitDisplay = (unit: Unit) => {
    if (unit.symbol) {
      return `${unit.name} (${unit.symbol})`;
    }
    return unit.name;
  };

  // Get unit value (symbol if available, otherwise name)
  const getUnitValue = (unit: Unit) => {
    return unit.symbol || unit.name;
  };

  return (
    <>
      {!showNewUnitInput ? (
        <Select
          value={formik.values.unit}
          onValueChange={(value) => {
            if (value === "add-new") {
              setShowNewUnitInput(true);
            } else {
              formik.setFieldValue("unit", value);
            }
          }}
        >
          <SelectTrigger id="unit" disabled={isSubmitting}>
            <div className="flex items-center gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <SelectValue placeholder="Select unit" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {units.map((unit: Unit) => (
              <SelectItem key={unit.id} value={getUnitValue(unit)}>
                {formatUnitDisplay(unit)}
              </SelectItem>
            ))}
            <SelectItem value="add-new" className="text-primary font-medium">
              + Add new Unit
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="space-y-2">
          <Input
            id="newUnitName"
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            placeholder="Enter unit name (e.g., Kilograms)"
          />
          <Input
            id="newUnitSymbol"
            value={newUnitSymbol}
            onChange={(e) => setNewUnitSymbol(e.target.value)}
            placeholder="Enter unit symbol (e.g., kg) - optional"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleUnitCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleAddNewUnit}
              disabled={isSubmitting || !newUnitName.trim()}
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

export default UnitsSelect;

