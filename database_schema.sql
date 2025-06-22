-- Drop existing objects to ensure clean slate
DROP FUNCTION IF EXISTS increment_votes(choices integer[]);
DROP TABLE IF EXISTS vote_results CASCADE;
DROP TABLE IF EXISTS user_votes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create vote_results table to store vote counts
CREATE TABLE vote_results (
  id SERIAL PRIMARY KEY,
  choice_number INT UNIQUE NOT NULL,
  vote_count INT NOT NULL DEFAULT 0
);

-- Create user_profiles table to store user information
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_votes table to track individual votes
CREATE TABLE user_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  choice_number INT NOT NULL,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, choice_number)
);

-- Pre-populate vote_results with all choices
INSERT INTO vote_results (choice_number, vote_count)
SELECT generate_series(0, 7), 0
ON CONFLICT (choice_number) DO NOTHING;

-- Create function to handle voting with user tracking
CREATE OR REPLACE FUNCTION submit_vote(
  user_email TEXT,
  choices integer[],
  user_full_name TEXT DEFAULT NULL,
  user_avatar_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  user_id UUID;
  choice INT;
  result JSON;
BEGIN
  -- Check if user has already voted
  SELECT up.id INTO user_id
  FROM user_profiles up
  WHERE up.email = user_email;
  
  IF user_id IS NOT NULL THEN
    -- Check if user has already voted for any of these choices
    IF EXISTS (
      SELECT 1 FROM user_votes 
      WHERE user_id = user_id 
      AND choice_number = ANY(choices)
    ) THEN
      RETURN json_build_object(
        'success', false,
        'message', 'You have already voted for one or more of these choices'
      );
    END IF;
  ELSE
    -- Create new user profile
    INSERT INTO user_profiles (email, full_name, avatar_url)
    VALUES (user_email, user_full_name, user_avatar_url)
    RETURNING id INTO user_id;
  END IF;
  
  -- Record votes and update vote counts
  FOREACH choice IN ARRAY choices
  LOOP
    -- Insert user vote record
    INSERT INTO user_votes (user_id, choice_number)
    VALUES (user_id, choice);
    
    -- Update vote count
    UPDATE vote_results 
    SET vote_count = vote_count + 1
    WHERE choice_number = choice;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Vote submitted successfully'
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get vote results
CREATE OR REPLACE FUNCTION get_vote_results()
RETURNS TABLE(choice_number INT, vote_count INT) AS $$
BEGIN
  RETURN QUERY
  SELECT vr.choice_number, vr.vote_count
  FROM vote_results vr
  ORDER BY vr.choice_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has voted
CREATE OR REPLACE FUNCTION has_user_voted(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT up.id INTO user_id
  FROM user_profiles up
  WHERE up.email = user_email;
  
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM user_votes 
    WHERE user_id = user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's previous votes
CREATE OR REPLACE FUNCTION get_user_votes(user_email TEXT)
RETURNS TABLE(choice_number INT) AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT up.id INTO user_id
  FROM user_profiles up
  WHERE up.email = user_email;
  
  IF user_id IS NOT NULL THEN
    RETURN QUERY
    SELECT uv.choice_number
    FROM user_votes uv
    WHERE uv.user_id = user_id
    ORDER BY uv.choice_number;
  END IF;
END;
$$ LANGUAGE plpgsql; 