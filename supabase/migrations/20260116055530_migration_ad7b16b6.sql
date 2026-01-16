-- Add foreign key constraint between games and profiles
ALTER TABLE public.games
ADD CONSTRAINT games_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;