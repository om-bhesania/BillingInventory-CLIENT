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
  createRawMaterialCategory, 
  getRawMaterialCategories,
  RawMaterialCategory 
} from "@/apis/rawMaterialCategoryApi";

const RawMaterialCategorySelect = ({
  formik,
  categories,
  addCategories,
  fetchCategories,
}) => {
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [lastAddedCategoryId, setLastAddedCategoryId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to select the newly added category once it's available in the categories list
  useEffect(() => {
    if (lastAddedCategoryId && categories.length > 0) {
      // Find the newly added category by name (assuming the API returns the created category with its ID)
      const addedCategory = categories.find(
        (category) => category.id === lastAddedCategoryId
      );
      if (addedCategory) {
        formik.setFieldValue("categoryId", addedCategory.id);
        setLastAddedCategoryId(null); // Reset after selection
      }
    }
  }, [categories, lastAddedCategoryId, formik]);

  const handleAddNewCategory = async () => {
    try {
      if (newCategoryName.trim()) {
        const newCategory = {
          name: newCategoryName,
        };

        // Do not set placeholder values that could leak into submission
        setIsSubmitting(true);
        const res = await addCategories(newCategory);
        console.log("res", res);

        // Store the ID of the newly created category
        if (res && res.id) {
          setLastAddedCategoryId(res.id);
        }

        // Reset the input and hide it
        setNewCategoryName("");
        setShowNewCategoryInput(false);

        // Fetch updated categories list
        await fetchCategories();
      }
    } catch (error) {
      console.error("Error adding raw material category:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryCancel = () => {
    setNewCategoryName("");
    setShowNewCategoryInput(false);
  };

  return (
    <>
      {!showNewCategoryInput ? (
        <Select
          value={formik.values.categoryId}
          onValueChange={(value) => {
            if (value === "add-new") {
              setShowNewCategoryInput(true);
            } else {
              formik.setFieldValue("categoryId", value);
            }
          }}
        >
          <SelectTrigger id="categoryId" disabled={isSubmitting}>
            <div className="flex items-center gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <SelectValue placeholder="Select raw material category" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
            <SelectItem value="add-new" className="text-primary font-medium">
              + Add new Category
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Input
          id="newCategory"
          name="categoryId"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Enter new raw material category name"
          contentRight={
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={handleCategoryCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="xs"
                onClick={handleAddNewCategory}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Adding...</span>
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

export default RawMaterialCategorySelect;
