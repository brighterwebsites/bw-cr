-- Step 1: add managed_website (must commit before use in next migration)
alter type public.asset_type add value if not exists 'managed_website';
