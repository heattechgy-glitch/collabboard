-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Boards table
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Board members table (for sharing/collaboration)
CREATE TABLE board_members (
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);

-- Columns table
CREATE TABLE columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

-- Cards table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards
CREATE POLICY "Users can view boards they own"
  ON boards FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view boards they are members of"
  ON boards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = boards.id
      AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their boards"
  ON boards FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their boards"
  ON boards FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for board_members
CREATE POLICY "Users can view members of boards they own or are members of"
  ON board_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_members.board_id
      AND (boards.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM board_members bm
        WHERE bm.board_id = boards.id
        AND bm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Board owners can insert members"
  ON board_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_members.board_id
      AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Board owners can delete members"
  ON board_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_members.board_id
      AND boards.owner_id = auth.uid()
    )
  );

-- RLS Policies for columns
CREATE POLICY "Users can view columns of accessible boards"
  ON columns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = columns.board_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert columns in accessible boards"
  ON columns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = columns.board_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update columns in accessible boards"
  ON columns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = columns.board_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete columns in accessible boards"
  ON columns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = columns.board_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

-- RLS Policies for cards
CREATE POLICY "Users can view cards in accessible boards"
  ON cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      WHERE columns.id = cards.column_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert cards in accessible boards"
  ON cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      WHERE columns.id = cards.column_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update cards in accessible boards"
  ON cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      WHERE columns.id = cards.column_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete cards in accessible boards"
  ON cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      WHERE columns.id = cards.column_id
      AND (
        boards.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM board_members
          WHERE board_members.board_id = boards.id
          AND board_members.user_id = auth.uid()
        )
      )
    )
  );

-- Create indexes for better query performance
CREATE INDEX idx_boards_owner_id ON boards(owner_id);
CREATE INDEX idx_board_members_board_id ON board_members(board_id);
CREATE INDEX idx_board_members_user_id ON board_members(user_id);
CREATE INDEX idx_columns_board_id ON columns(board_id);
CREATE INDEX idx_cards_column_id ON cards(column_id);

-- Trigger to update cards.updated_at on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cards_updated_at
BEFORE UPDATE ON cards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();