-- Enable PostGIS extension if not already enabled
create extension if not exists postgis;

-- Create the reports table
create table if not exists public.reports (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    type text not null,
    description text,
    region_name text,
    
    -- Location handling
    location geography(POINT) not null,
    
    -- Generated columns for easy UI consumption (matches TypeScript interface)
    latitude float8 generated always as (st_y(location::geometry)) stored,
    longitude float8 generated always as (st_x(location::geometry)) stored,
    
    created_at timestamptz default now() not null,
    -- Default expiration: 12 hours from creation (adjust as needed)
    expires_at timestamptz default (now() + interval '12 hours') not null,
    
    verification_score int default 0 not null
);

-- Enable Row Level Security
alter table public.reports enable row level security;

-- Policies

-- Policy: Anyone can view active reports
-- (You might want to restrict this to authenticated users depending on your app's privacy)
create policy "Anyone can view reports"
on public.reports for select
using (true);

-- Policy: Authenticated users can create reports
create policy "Authenticated users can create reports"
on public.reports for insert
to authenticated
with check (auth.uid() = user_id);

-- Policy: Users can update their own reports (if needed)
create policy "Users can update their own reports"
on public.reports for update
to authenticated
using (auth.uid() = user_id);

-- Create index for geospatial queries (crucial for "nearby" searches)
create index if not exists reports_location_idx
on public.reports
using GIST (location);
