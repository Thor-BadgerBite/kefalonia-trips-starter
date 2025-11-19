-- In-app messaging system
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Participants
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'archived', 'closed'

  -- Last message info (denormalized for performance)
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  last_message_preview TEXT,

  -- Unread counts
  unread_customer INTEGER DEFAULT 0,
  unread_provider INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Foreign keys
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,

  -- Sender (either 'customer' or 'provider')
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'provider')),
  sender_id UUID, -- provider.id if sender_type is 'provider'
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,

  -- Message content
  content TEXT NOT NULL,
  attachments TEXT[], -- URLs to uploaded files

  -- Read status
  read_at TIMESTAMP WITH TIME ZONE,
  read_by TEXT -- 'customer' or 'provider'
);

-- Indexes
CREATE INDEX idx_conversations_provider_id ON conversations(provider_id);
CREATE INDEX idx_conversations_booking_id ON conversations(booking_id);
CREATE INDEX idx_conversations_customer_email ON conversations(customer_email);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_sender_type ON messages(sender_type);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Providers can view their conversations
CREATE POLICY "Providers can view their conversations"
  ON conversations
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

-- Providers can update their conversations
CREATE POLICY "Providers can update their conversations"
  ON conversations
  FOR UPDATE
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

-- Providers can view messages in their conversations
CREATE POLICY "Providers can view their messages"
  ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
      )
    )
  );

-- Providers can insert messages
CREATE POLICY "Providers can send messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can manage all conversations and messages
CREATE POLICY "Service role can manage all conversations"
  ON conversations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all messages"
  ON messages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    unread_customer = CASE
      WHEN NEW.sender_type = 'provider' THEN unread_customer + 1
      ELSE unread_customer
    END,
    unread_provider = CASE
      WHEN NEW.sender_type = 'customer' THEN unread_provider + 1
      ELSE unread_provider
    END,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_conversation_id UUID,
  p_reader_type TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET read_at = now(), read_by = p_reader_type
  WHERE conversation_id = p_conversation_id
    AND read_at IS NULL
    AND sender_type != p_reader_type;

  -- Reset unread count
  IF p_reader_type = 'customer' THEN
    UPDATE conversations
    SET unread_customer = 0
    WHERE id = p_conversation_id;
  ELSE
    UPDATE conversations
    SET unread_provider = 0
    WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update trigger for conversations updated_at
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_timestamp
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();
