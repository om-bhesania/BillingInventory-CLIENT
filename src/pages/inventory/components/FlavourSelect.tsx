import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
 

const FlavorSelect = ({ formik, flavours, addFlavours, fetchFlavours }) => {
  const [showNewFlavorInput, setShowNewFlavorInput] = useState(false);
  const [newFlavorName, setNewFlavorName] = useState("");
  const [lastAddedFlavorId, setLastAddedFlavorId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to select the newly added flavor once it's available in the flavours list
  useEffect(() => {
    if (lastAddedFlavorId && flavours.length > 0) {
      // Find the newly added flavor by name (assuming the API returns the created flavor with its ID)
      const addedFlavor = flavours.find(
        (flavor) => flavor.id === lastAddedFlavorId
      );
      if (addedFlavor) {
        formik.setFieldValue("flavorId", addedFlavor.id);
        setLastAddedFlavorId(null); // Reset after selection
      }
    }
  }, [flavours, lastAddedFlavorId, formik]);

  const handleAddNewFlavor = async () => {
    try {
      if (newFlavorName.trim()) {
        const newFlavor = {
          name: newFlavorName,
        };

        // Do not set placeholder values that could leak into submission
        setIsSubmitting(true);
        const res = await addFlavours(newFlavor);
        console.log("res", res);

        // Store the ID of the newly created flavor
        if (res && res.id) {
          setLastAddedFlavorId(res.id);
        }

        // Reset the input and hide it
        setNewFlavorName("");
        setShowNewFlavorInput(false);

        // Fetch updated flavors list
        await fetchFlavours();
      }
    } catch (error) {
      console.error("Error adding flavor:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlavourCancel = () => {
    setNewFlavorName("");
    setShowNewFlavorInput(false);
  };

  return (
    <>
      {!showNewFlavorInput ? (
        <Select
          value={formik.values.flavorId}
          onValueChange={(value) => {
            if (value === "add-new") {
              setShowNewFlavorInput(true);
            } else {
              formik.setFieldValue("flavorId", value);
            }
          }}
        >
          <SelectTrigger id="flavorId" disabled={isSubmitting}>
            <div className="flex items-center gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              <SelectValue placeholder="Select flavor" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {flavours.map((flavor) => (
              <SelectItem key={flavor.id} value={flavor.id}>
                {flavor.name}
              </SelectItem>
            ))}
            <SelectItem value="add-new" className="text-primary font-medium">
              + Add new Flavor
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Input
          id="newFlavor"
          name="flavorId"
          value={newFlavorName}
          onChange={(e) => setNewFlavorName(e.target.value)}
          placeholder="Enter new flavor name"
          contentRight={
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={handleFlavourCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="xs"
                onClick={handleAddNewFlavor}
                disabled={isSubmitting}
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
          }
        />
      )}
    </>
  );
};

export default FlavorSelect;
