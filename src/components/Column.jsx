import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Trash2 } from "lucide-react";
import Card from "@/components/Card";
import AddCardButton from "@/components/AddCardButton";

export default function Column({ column, cards }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = async () => {
    setIsEditing(false);
    if (title.trim() !== column.title) {
      await supabase
        .from("columns")
        .update({ title: title.trim() })
        .eq("id", column.id);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
    if (e.key === "Escape") {
      setTitle(column.title);
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Delete this column and all its cards?")) {
      await supabase.from("columns").delete().eq("id", column.id);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col min-w-[300px] max-w-[300px] h-fit max-h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between mb-4">
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="bg-gray-700 text-white px-2 py-1 rounded flex-1 mr-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        ) : (
          <h3
            onDoubleClick={handleDoubleClick}
            className="text-lg font-semibold text-white flex-1 cursor-pointer hover:text-sky-400 transition-colors"
          >
            {column.title}
          </h3>
        )}
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          title="Delete column"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {cards
          .filter((card) => card.column_id === column.id)
          .map((card) => (
            <Card key={card.id} card={card} />
          ))}
      </div>

      <AddCardButton columnId={column.id} />
    </div>
  );
}