import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X } from "lucide-react";

export default function CreateBoardModal({ isOpen, onClose, onSuccess }) {
  const [boardName, setBoardName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!boardName.trim()) {
      setError("Board name is required");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("You must be logged in to create a board");
        setIsLoading(false);
        return;
      }

      const { data, error: insertError } = await supabase
        .from("boards")
        .insert([
          {
            name: boardName.trim(),
            owner_id: user.id
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setBoardName("");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating board:", err);
      setError(err.message || "Failed to create board");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setBoardName("");
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6">
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Create New Board</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="boardName" className="block text-sm font-medium text-gray-300 mb-2">
              Board Name
            </label>
            <input
              id="boardName"
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              disabled={isLoading}
              placeholder="Enter board name..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:opacity-50"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !boardName.trim()}
              className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Board"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}