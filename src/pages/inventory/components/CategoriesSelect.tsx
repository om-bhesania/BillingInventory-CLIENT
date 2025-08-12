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

const CategoriesSelect = ({
  formik,
  categories,
  addCategories,
  fetchCategories,
}) => {
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [lastAddedCategoryId, setLastAddedCategoryId] = useState(null);

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

        // Set a temporary value while the API call is in progress
        formik.setFieldValue("categoryId", "adding...");

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
      console.error("Error adding category:", error);
      return false;
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
          <SelectTrigger id="categoryId">
            <SelectValue placeholder="Select category" />
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
          placeholder="Enter new category name"
          contentRight={
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={handleCategoryCancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="xs"
                onClick={handleAddNewCategory}
              >
                Add
              </Button>
            </div>
          }
        />
      )}
    </>
  );
};

export default CategoriesSelect;
  
  

