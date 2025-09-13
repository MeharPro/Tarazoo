-- Fix RLS policies to allow product sync
-- Run this in Supabase SQL editor

-- Drop existing policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;

-- Create new policies that allow both SELECT and INSERT
CREATE POLICY "Products public read" ON products
    FOR SELECT USING (true);

CREATE POLICY "Products public insert" ON products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Products public update" ON products
    FOR UPDATE USING (true) WITH CHECK (true);

-- Verify policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'products';
