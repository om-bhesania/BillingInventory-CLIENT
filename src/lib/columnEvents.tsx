import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

export const getActionsColumn: React.FC<any> = ({ type, onClick }) => {
  if (type === "Delete") {
    return (
      <Button type="button" variant="ghost" size="icon" onClick={onClick}>
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Remove</span>
      </Button>
    );
  }
  if (type === "Edit") {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-6 w-6"
        onClick={onClick}
      >
        <Plus className="h-3 w-3" />
        <span className="sr-only">Increase</span>
      </Button>
    );
  }
};
