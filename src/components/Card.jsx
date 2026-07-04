import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Card({ card, columnId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card.title || "");
  const [description, setDescription] = useState(card.description || "");

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("cards")
        .update({
          title: title.trim(),
          description: description.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", card.id);

      if (error) throw error;

      setIsEditing(false);
    } catch (err) {
      console.error("Error updating card:", err);
      alert("Failed to update card");
    }
  };

  const handleCancel = () => {
    setTitle(card.title || "");
    setDescription(card.description || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div
        id={card.id}
        className="bg-zinc-800 rounded-lg shadow-lg p-4 mb-3 border border-zinc-700"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-zinc-900 text-white border border-zinc-600 rounded px-2 py-1 mb-2 focus:outline-none focus:border-sky-500"
          placeholder="Card title"
          autoFocus
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-zinc-900 text-white border border-zinc-600 rounded px-2 py-1 mb-2 focus:outline-none focus:border-sky-500 resize-none"
          placeholder="Description"
          rows={3}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded text-sm transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id={card.id}
      onDoubleClick={handleDoubleClick}
      className="bg-zinc-800 rounded-lg shadow-lg p-4 mb-3 border border-zinc-700 hover:border-zinc-600 cursor-pointer transition-colors"
    >
      <h3 className="text-white font-semibold mb-2">{title || "Untitled"}</h3>
      {description && (
        <p className="text-zinc-400 text-sm whitespace-pre-wrap">{description}</p>
      )}
    </div>
  );
}