import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus } from "lucide-react";

export default function AddColumnButton({ boardId }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddColumn = async () => {
    if (isAdding) return;
    setIsAdding(true);

    try {
      const { data: existingColumns, error: fetchError } = await supabase
        .from("columns")
        .select("position")
        .eq("board_id", boardId)
        .order("position", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const maxPosition = existingColumns?.length > 0 ? existingColumns[0].position : 0;
      const newPosition = maxPosition + 1;

      const { error: insertError } = await supabase
        .from("columns")
        .insert({
          title: "New Column",
          position: newPosition,
          board_id: boardId,
        });

      if (insertError) throw insertError;
    } catch (error) {
      console.error("Error adding column:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      onClick={handleAddColumn}
      disabled={isAdding}
      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Plus className="w-5 h-5" />
      <span>{isAdding ? "Adding..." : "Add Column"}</span>
    </button>
  );
}