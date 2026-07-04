import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus } from "lucide-react";

export default function AddCardButton({ columnId, cards }) {
  const [loading, setLoading] = useState(false);

  const handleAddCard = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Calculate max position from current cards in this column
      const columnCards = cards.filter(card => card.column_id === columnId);
      const maxPosition = columnCards.length > 0 
        ? Math.max(...columnCards.map(card => card.position || 0))
        : 0;
      
      const newPosition = maxPosition + 1;

      // Insert new card
      const { data, error } = await supabase
        .from("cards")
        .insert({
          title: "New Card",
          column_id: columnId,
          position: newPosition
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating card:", error);
        alert("Failed to create card");
      }
    } catch (err) {
      console.error("Error adding card:", err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddCard}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-[#0ea5e9] hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Plus className="w-4 h-4" />
      <span>{loading ? "Adding..." : "Add Card"}</span>
    </button>
  );
}