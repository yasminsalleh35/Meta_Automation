-- Add foreign key constraint to fix comment loading with user profiles
ALTER TABLE public.learning_content_comments 
ADD CONSTRAINT fk_learning_comments_user_profile 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;